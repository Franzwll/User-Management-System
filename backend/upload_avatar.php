<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid user_id is required']);
    exit;
}

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No avatar image uploaded or upload error occurred']);
    exit;
}

$file = $_FILES['avatar'];
$allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.']);
    exit;
}

// 5MB limit
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'File size exceeds 5MB limit.']);
    exit;
}

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $user_id . '_' . time() . '.' . $extension;

    try {
        $supabase = get_supabase();
        
        // Upload to Supabase Storage instead of local filesystem
        $avatar_url = $supabase->uploadFile('avatars', $filename, $file['tmp_name'], $file['type']);
        
        $supabase->update('users_ums', [
            'avatar_url' => $avatar_url
        ], ['id' => 'eq.' . $user_id]);
        
        // Log the change
        $userStmt = $supabase->select('users_ums', 'email', ['id' => 'eq.' . $user_id]);
        $email = (!empty($userStmt) && !isset($userStmt['error']) && isset($userStmt[0])) ? $userStmt[0]['email'] : 'unknown';

        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $supabase->insert('activity_logs_ums', [
            'user_id' => $user_id,
            'event_type' => 'update',
            'action' => 'User avatar updated|' . $email,
            'ip_address' => $ip
        ]);

        echo json_encode([
            'success' => true, 
            'message' => 'Avatar uploaded successfully',
            'avatar_url' => $avatar_url
        ]);
        
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
    }
?>
