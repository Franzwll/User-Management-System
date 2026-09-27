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

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

$userId    = $data['user_id'] ?? null;
$eventType = $data['event_type'] ?? 'access';
$action    = trim($data['action'] ?? '');
$moduleId  = isset($data['module_id']) && $data['module_id'] !== '' ? (int)$data['module_id'] : null;
$submoduleId = isset($data['submodule_id']) && $data['submodule_id'] !== '' ? (int)$data['submodule_id'] : null;

function get_real_ip() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) { $ip = $_SERVER['HTTP_CLIENT_IP']; }
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ips[0]);
    }
    return $ip === '::1' ? '127.0.0.1' : $ip;
}
$ip = get_real_ip();

if ($action === '') {
    http_response_code(422);
    echo json_encode(['error' => 'Action text is required']);
    exit;
}

// Validate event_type
$allowedTypes = ['login', 'create', 'update', 'delete', 'password', 'access'];
if (!in_array($eventType, $allowedTypes)) {
    $eventType = 'access';
}

try {
    $supabase = get_supabase();
    $result = $supabase->insert('activity_logs_ums', [
        'user_id'    => $userId,
        'event_type' => $eventType,
        'module_id'  => $moduleId,
        'submodule_id'  => $submoduleId,
        'action'     => $action,
        'ip_address' => $ip,
        'created_at' => date('Y-m-d H:i:s')
    ]);

    if (isset($result['error'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Database insert error', 'details' => $result]);
        exit;
    }

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
