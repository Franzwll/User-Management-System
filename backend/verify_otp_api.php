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
$data = json_decode($raw, true) ?? [];

$email = trim($data['email'] ?? '');
$otp   = trim($data['otp']   ?? '');

if ($email === '' || $otp === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Email and OTP code are required']);
    exit;
}

try {
    $supabase = get_supabase();

    // ── Find the user ────────────────────────────────────────────────────
    $usersData = $supabase->select('users_ums', 'id, full_name, email, status, roles_ums(name)', [
        'email' => 'ilike.' . $email
    ]);

    if (empty($usersData) || isset($usersData['error']) || !isset($usersData[0])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid session. Please log in again.']);
        exit;
    }

    $user = $usersData[0];
    $user['role'] = $user['roles_ums']['name'] ?? 'User';

    // ── Find the latest valid OTP ────────────────────────────────────────
    $nowIso = date('c');
    $otpData = $supabase->select('user_otps_ums', 'id', [
        'user_id' => 'eq.' . $user['id'],
        'otp_code' => 'eq.' . $otp,
        'is_used' => 'eq.0',
        'expires_at' => 'gt.' . $nowIso,
        'order' => 'created_at.desc',
        'limit' => 1
    ]);

    function get_real_ip() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) { $ip = $_SERVER['HTTP_CLIENT_IP']; }
        elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($ips[0]);
        }
        return $ip === '::1' ? '127.0.0.1' : $ip;
    }

    if (empty($otpData) || isset($otpData['error']) || !isset($otpData[0])) {
        // Log failed OTP attempt
        $ip = get_real_ip();
        $supabase->insert('activity_logs_ums', [
            'user_id' => $user['id'],
            'event_type' => 'login',
            'module_id' => 10,
            'submodule_id' => 3,
            'action' => 'Failed OTP verification|' . $user['email'],
            'ip_address' => $ip
        ]);

        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired code. Please try again or request a new code.']);
        exit;
    }

    $otpRow = $otpData[0];

    // ── Mark OTP as used ─────────────────────────────────────────────────
    $supabase->update('user_otps_ums', ['is_used' => 1], ['id' => 'eq.' . $otpRow['id']]);

    // ── Retrieve or create the active session token ──────────────────────
    $ip = get_real_ip();
    $sessionData = $supabase->select('active_sessions_ums', 'session_token', [
        'user_id' => 'eq.' . $user['id'],
        'ip_address' => 'eq.' . $ip,
        'is_terminated' => 'eq.0',
        'order' => 'started_at.desc',
        'limit' => 1
    ]);
    
    $sessionToken = bin2hex(random_bytes(32));
    if (!empty($sessionData) && !isset($sessionData['error']) && isset($sessionData[0])) {
        $sessionToken = $sessionData[0]['session_token'];
    } else {
        // If there was no active session found (which is rare but possible),
        // we should create one here to be safe and logical.
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $supabase->insert('active_sessions_ums', [
            'user_id' => $user['id'],
            'session_token' => $sessionToken,
            'ip_address' => $ip,
            'user_agent' => $ua,
            'location' => 'Unknown'
        ]);
    }

    $supabase->insert('activity_logs_ums', [
        'user_id' => $user['id'],
        'event_type' => 'login',
        'module_id' => 10,
        'submodule_id' => 3,
        'action' => '2FA OTP verified|' . $user['email'],
        'ip_address' => $ip
    ]);

    // ── Return success ────────────────────────────────────────────────────
    echo json_encode([
        'success'       => true,
        'user_id'       => $user['id'],
        'email'         => $user['email'],
        'full_name'     => $user['full_name'],
        'role'          => $user['role'],
        'session_token' => $sessionToken,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
