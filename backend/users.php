<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Actor-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handle_get();
            break;
        case 'POST':
            handle_post();
            break;
        case 'PUT':
        case 'PATCH':
            handle_put();
            break;
        case 'DELETE':
            handle_delete();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function validate_password(string $password, SupabaseRestApi $supabase): ?string
{
    $settings = $supabase->select('auth_settings_ums', 'setting_value', ['setting_key' => 'eq.password_policy']);
    $enabled = false;
    if (!empty($settings) && is_array($settings) && !isset($settings['error'])) {
        $enabled = ($settings[0]['setting_value'] ?? '0') === '1';
    }
    
    if (!$enabled) return null;

    if (strlen($password) < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return "Password must include at least one uppercase letter.";
    }
    if (!preg_match('/[0-9]/', $password)) {
        return "Password must include at least one number.";
    }
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        return "Password must include at least one special character.";
    }
    return null;
}

function handle_get(): void
{
    $supabase = get_supabase();

    if (!empty($_GET['id'])) {
        $id = (int)$_GET['id'];
        $usersData = $supabase->select('users_ums', 'id, full_name, email, student_employee_id, department, program, status, avatar_url, role_id, roles_ums(name), module_id, modules_ums(name)', ['id' => 'eq.' . $id]);
        
        if (empty($usersData) || isset($usersData['error']) || !isset($usersData[0])) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }
        $user = $usersData[0];
        $user['role_name'] = $user['roles_ums']['name'] ?? 'Unknown';
        $user['module_name'] = $user['modules_ums']['name'] ?? 'None';
        unset($user['roles_ums']);
        unset($user['modules_ums']);
        echo json_encode($user);
        return;
    }

    $usersData = $supabase->select('users_ums', 'id, full_name, email, student_employee_id, department, program, status, locked_until, avatar_url, last_login_at, created_at, role_id, roles_ums(name), module_id, modules_ums(name)', [
        'order' => 'id.desc'
    ]);
    
    $users = is_array($usersData) && !isset($usersData['error']) ? $usersData : [];
    
    // Auto-revert suspended status if lockout expired
    $now = time();
    $revertedIds = [];
    foreach ($users as &$u) {
        $u['role_name'] = $u['roles_ums']['name'] ?? 'Unknown';
        $u['module_name'] = $u['modules_ums']['name'] ?? 'None';
        unset($u['roles_ums']);
        unset($u['modules_ums']);
        
        if ($u['status'] === 'suspended' && $u['locked_until']) {
            if (strtotime($u['locked_until']) <= $now) {
                $u['status'] = 'active';
                $u['locked_until'] = null;
                $revertedIds[] = $u['id'];
            }
        }
    }

    if (!empty($revertedIds)) {
        $supabase->update('users_ums', [
            'status' => 'active',
            'locked_until' => null
        ], ['id' => 'in.(' . implode(',', $revertedIds) . ')']);
    }

    echo json_encode($users);
}

function handle_post(): void
{
    $supabase = get_supabase();
    $data = read_json_body();

    $full_name = trim($data['full_name'] ?? '');
    $email     = trim($data['email'] ?? '');
    $role_id   = (int) ($data['role_id'] ?? 0);
    $module_id = (int) ($data['module_id'] ?? 10);

    if ($full_name === '' || $email === '' || $role_id <= 0) {
        http_response_code(422);
        echo json_encode(['error' => 'full_name, email and role_id are required']);
        return;
    }

    $student_employee_id = trim($data['student_employee_id'] ?? '');
    $department          = trim($data['department'] ?? '');
    $program             = trim($data['program'] ?? '');
    $status              = $data['status'] ?? 'active';
    $password            = $data['password'] ?? 'ChangeMe123!';

    $passwordErr = validate_password($password, $supabase);
    if ($passwordErr) {
        http_response_code(422);
        echo json_encode(['error' => $passwordErr]);
        return;
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $pdo = get_pdo();
    $stmt = $pdo->prepare("INSERT INTO users_ums (full_name, student_employee_id, email, role_id, module_id, department, program, password_hash, status) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id");
    
    try {
        $stmt->execute([
            $full_name,
            $student_employee_id ?: null,
            $email,
            $role_id,
            $module_id,
            $department ?: null,
            $program ?: null,
            $password_hash,
            in_array($status, ['active', 'inactive', 'pending', 'suspended'], true) ? $status : 'active'
        ]);
        $id = (int)$stmt->fetchColumn();
    } catch (PDOException $e) {
        $id = null;
        $result = ['error' => $e->getMessage()];
    }

    if ($id) {
        // Log creation in activity_logs_ums
        $actor_id = $_SERVER['HTTP_X_ACTOR_ID'] ?? null;
        $actor_id = ($actor_id !== null && $actor_id !== '' && $actor_id !== 'null') ? (int)$actor_id : null;
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        
        $supabase->insert('activity_logs_ums', [
            'user_id' => $actor_id ?: $id,
            'event_type' => 'create',
            'module_id' => 10,
            'submodule_id' => 1,
            'action' => 'New user account created|' . $email,
            'ip_address' => $ip
        ]);

        http_response_code(201);
        echo json_encode(['id' => $id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user', 'details' => $result]);
    }
}

function handle_put(): void
{
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'id query parameter is required']);
        return;
    }

    $id   = (int) $_GET['id'];
    $supabase = get_supabase();
    $data = read_json_body();
    $updateData = [];
    $fields = [];

    if (array_key_exists('full_name', $data)) {
        $updateData['full_name'] = trim((string) $data['full_name']);
        $fields[] = 'full_name';
    }
    if (array_key_exists('email', $data)) {
        $updateData['email'] = trim((string) $data['email']);
        $fields[] = 'email';
    }
    if (array_key_exists('student_employee_id', $data)) {
        $updateData['student_employee_id'] = trim((string) $data['student_employee_id']) ?: null;
        $fields[] = 'student_employee_id';
    }
    if (array_key_exists('department', $data)) {
        $updateData['department'] = trim((string) $data['department']) ?: null;
        $fields[] = 'department';
    }
    if (array_key_exists('program', $data)) {
        $updateData['program'] = trim((string) $data['program']) ?: null;
        $fields[] = 'program';
    }
    if (array_key_exists('role_id', $data)) {
        $updateData['role_id'] = (int) $data['role_id'];
        $fields[] = 'role_id';
    }
    if (array_key_exists('module_id', $data)) {
        $updateData['module_id'] = (int) $data['module_id'];
        $fields[] = 'module_id';
    }
    if (array_key_exists('status', $data)) {
        $status = (string) $data['status'];
        if (!in_array($status, ['active', 'inactive', 'pending', 'suspended'], true)) {
            $status = 'active';
        }
        $updateData['status'] = $status;
        $fields[] = 'status';
    }
    if (array_key_exists('avatar_url', $data)) {
        $updateData['avatar_url'] = trim((string) $data['avatar_url']) ?: null;
        $fields[] = 'avatar_url';
    }
    if (array_key_exists('password', $data) && $data['password'] !== '') {
        $password = (string)$data['password'];
        $passwordErr = validate_password($password, $supabase);
        if ($passwordErr) {
            http_response_code(422);
            echo json_encode(['error' => $passwordErr]);
            return;
        }
        $updateData['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        $fields[] = 'password_hash';
    }

    if (empty($updateData)) {
        http_response_code(400);
        echo json_encode(['error' => 'No updatable fields provided']);
        return;
    }

    $pdo = get_pdo();
    foreach ($updateData as $key => $val) {
        $set[] = "$key = :$key";
    }
    
    $sql = "UPDATE users_ums SET " . implode(', ', $set) . " WHERE id = :id";
    $updateData['id'] = $id;
    
    // Capture old email for logging
    $oldData = $supabase->select('users_ums', 'full_name, email', ['id' => 'eq.' . $id]);
    $updatedEmail = $data['email'] ?? ($oldData[0]['email'] ?? 'unknown');

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($updateData);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update user', 'details' => $e->getMessage()]);
        return;
    }

    // Log the update
    $fieldLabels = [
        'full_name'            => 'Name',
        'email'                => 'Email',
        'role_id'              => 'Role',
        'status'               => 'Status',
        'student_employee_id'  => 'Student/Employee ID',
        'department'           => 'Department',
        'program'              => 'Program',
        'avatar_url'           => 'Avatar',
        'password_hash'        => 'Password',
    ];
    
    $changedLabels = array_map(function ($col) use ($fieldLabels) {
        return $fieldLabels[$col] ?? ucfirst(str_replace('_', ' ', $col));
    }, $fields);
    
    $summary = implode(', ', $changedLabels);

    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $actor_id = $_SERVER['HTTP_X_ACTOR_ID'] ?? null;
    $actor_id = ($actor_id !== null && $actor_id !== '' && $actor_id !== 'null') ? (int)$actor_id : null;
    
    $supabase->insert('activity_logs_ums', [
        'user_id' => $actor_id ?: $id,
        'event_type' => 'update',
        'module_id' => 10,
        'submodule_id' => 1,
        'action' => 'User profile updated|' . $updatedEmail,
        'ip_address' => $ip
    ]);

    echo json_encode(['success' => true]);
}

function handle_delete(): void
{
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'id query parameter is required']);
        return;
    }

    $id  = (int) $_GET['id'];
    $supabase = get_supabase();

    // Fetch user info before deleting so we can log it
    $infoData = $supabase->select('users_ums', 'full_name, email', ['id' => 'eq.' . $id]);
    $userInfo = (!empty($infoData) && !isset($infoData['error'])) ? $infoData[0] : null;

    $userEmail = $userInfo ? $userInfo['email'] : null;

    // Log the deletion BEFORE removing the row
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $actor_id = $_SERVER['HTTP_X_ACTOR_ID'] ?? null;
    $actor_id = ($actor_id !== null && $actor_id !== '' && $actor_id !== 'null') ? (int)$actor_id : null;
    
    $supabase->insert('activity_logs_ums', [
        'user_id' => $actor_id,
        'event_type' => 'delete',
        'module_id' => 10,
        'submodule_id' => 1,
        'action' => 'User record deleted|' . ($userEmail ?? 'unknown'),
        'ip_address' => $ip
    ]);

    // Hard delete: remove user row
    try {
        $pdo = get_pdo();
        $stmt = $pdo->prepare("DELETE FROM users_ums WHERE id = ?");
        $stmt->execute([$id]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete user', 'details' => $e->getMessage()]);
        return;
    }

    echo json_encode(['success' => true]);
}
