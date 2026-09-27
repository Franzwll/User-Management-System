<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $supabase = get_supabase();

    if ($method === 'GET') {
        switch ($action) {
            case 'list_roles':
                handle_list_roles($supabase);
                break;
            case 'list_permissions':
                handle_list_permissions($supabase);
                break;
            case 'get_role_permissions':
                handle_get_role_permissions($supabase);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
    } elseif ($method === 'POST') {
        switch ($action) {
            case 'update_role_permissions':
                handle_update_role_permissions($supabase);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}

function handle_list_roles($supabase) {
    // We use inner select to count related tables dynamically
    $roles = $supabase->select('roles_ums', '*, users_ums(id), role_permissions_ums(permission_id)');
    
    if (is_array($roles) && !isset($roles['error'])) {
        foreach ($roles as &$r) {
            $r['user_count'] = count($r['users_ums'] ?? []);
            $r['perm_count'] = count($r['role_permissions_ums'] ?? []);
            unset($r['users_ums'], $r['role_permissions_ums']); // Cleanup array so it matches expected structure
        }
        echo json_encode($roles);
    } else {
        echo json_encode([]);
    }
}

function handle_list_permissions($supabase) {
    $permissions = $supabase->select('permissions_ums', '*');
    echo json_encode((is_array($permissions) && !isset($permissions['error'])) ? $permissions : []);
}

function handle_get_role_permissions($supabase) {
    $role_id = (int)($_GET['role_id'] ?? 0);
    if ($role_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'role_id is required']);
        return;
    }

    $perms = $supabase->select('role_permissions_ums', 'permission_id', ['role_id' => 'eq.' . $role_id]);
    $ids = [];
    if (is_array($perms) && !isset($perms['error'])) {
        $ids = array_column($perms, 'permission_id');
    }
    echo json_encode($ids);
}

function handle_update_role_permissions($supabase) {
    $data = json_decode(file_get_contents('php://input'), true);
    $role_id = (int)($data['role_id'] ?? 0);
    $permission_ids = $data['permission_ids'] ?? [];

    if ($role_id <= 0 || !is_array($permission_ids)) {
        http_response_code(400);
        echo json_encode(['error' => 'role_id and permission_ids (array) are required']);
        return;
    }

    try {
        // Remove existing
        $supabase->delete('role_permissions_ums', ['role_id' => 'eq.' . $role_id]);

        // Add new (Bulk)
        if (!empty($permission_ids)) {
            $insertData = [];
            foreach ($permission_ids as $pid) {
                $insertData[] = [
                    'role_id' => $role_id, 
                    'permission_id' => (int)$pid
                ];
            }
            $supabase->insert('role_permissions_ums', $insertData);
        }

        // Log the change
        $roleData = $supabase->select('roles_ums', 'name', ['id' => 'eq.' . $role_id]);
        $roleName = (is_array($roleData) && isset($roleData[0])) ? $roleData[0]['name'] : 'unknown';

        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $actorId = isset($data['user_id']) ? (int)$data['user_id'] : null;

        $supabase->insert('activity_logs_ums', [
            'user_id' => $actorId,
            'event_type' => 'update',
            'module_id' => 10,
            'submodule_id' => 2,
            'action' => 'Role permissions updated|' . $roleName,
            'ip_address' => $ip,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        throw $e;
    }
}
