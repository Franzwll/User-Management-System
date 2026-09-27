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

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$token = isset($data['token']) ? trim($data['token']) : '';
$new_password = isset($data['password']) ? $data['password'] : '';

if (empty($token) || empty($new_password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Token and password are required']);
    exit;
}

try {
    $supabase = get_supabase(true);

    // Verify token
    $resetsData = $supabase->select('password_resets_ums', 'id, user_id, expires_at, used_at', [
        'token' => 'eq.' . $token
    ]);

    if (empty($resetsData) || isset($resetsData['error']) || !isset($resetsData[0])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid reset token']);
        exit;
    }

    $reset = $resetsData[0];

    if ($reset['used_at'] !== null) {
        http_response_code(400);
        echo json_encode(['error' => 'Token has already been used']);
        exit;
    }

    if (strtotime($reset['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['error' => 'Token has expired']);
        exit;
    }

    // Update password
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    $nowIso = date('c');

    $supabase->update('users_ums', [
        'password_hash' => $password_hash,
        'updated_at' => $nowIso
    ], ['id' => 'eq.' . $reset['user_id']]);

    // Mark token as used
    $supabase->update('password_resets_ums', [
        'used_at' => $nowIso
    ], ['id' => 'eq.' . $reset['id']]);

    // Log the event
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $supabase->insert('activity_logs_ums', [
        'user_id' => $reset['user_id'],
        'event_type' => 'password',
        'action' => 'Password reset successfully completed via recovery token',
        'ip_address' => $ip
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Password has been updated successfully.'
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
