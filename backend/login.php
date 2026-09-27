<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth_helper.php';
require_once __DIR__ . '/../vendor/autoload.php';
$mailConfig = require_once __DIR__ . '/config/mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

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

$email    = trim($data['email']    ?? '');
$password = trim($data['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

// Optional module attribution for logging
// Optional module attribution for logging
$moduleId = isset($data['module_id']) ? (int)$data['module_id'] : 10; // Default: User Management
$submoduleId = isset($data['submodule_id']) ? (int)$data['submodule_id'] : 3; // Default: Auth & Security

try {
    $supabase = get_supabase();

    // ── Load auth settings ──────────────────────────────────────────────
    $settingsData = $supabase->select('auth_settings_ums', 'setting_key, setting_value');
    $settings = [];
    if (is_array($settingsData) && !isset($settingsData['error'])) {
        foreach ($settingsData as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
    }

    $lockoutEnabled  = ($settings['account_lockout']  ?? '0') === '1';
    $twoFactorEnabled = ($settings['two_factor_auth'] ?? '0') === '1';
    $maxAttempts     = (int)($settings['max_attempts']      ?? 5);
    $lockoutMinutes  = (int)($settings['lockout_duration']  ?? 15);

    // ── Find user ───────────────────────────────────────────────────────
    $usersData = $supabase->select('users_ums', 'id, full_name, email, password_hash, status, locked_until, module_id, roles_ums(name)', [
        'email' => 'ilike.' . $email // ilike makes it case-insensitive
    ]);

    if (empty($usersData) || isset($usersData['error']) || !isset($usersData[0])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }

    $user = $usersData[0];
    $user['role'] = $user['roles_ums']['name'] ?? 'User';

    // ── Lockout check ───────────────────────────────────────────────────
    if ($lockoutEnabled && $user['locked_until'] !== null) {
        if (strtotime($user['locked_until']) > time()) {
            $remaining = ceil((strtotime($user['locked_until']) - time()) / 60);
            http_response_code(403);
            echo json_encode(['error' => "Account locked. Try again in {$remaining} minute(s)."]);
            exit;
        } else {
            // Auto-unlock: lockout window has passed
            $supabase->update('users_ums', [
                'status' => 'active', 
                'locked_until' => null
            ], ['id' => 'eq.' . $user['id']]);
            $user['status']       = 'active';
            $user['locked_until'] = null;
        }
    }

    // ── Status check ────────────────────────────────────────────────────
    if ($user['status'] !== 'active') {
        http_response_code(403);
        echo json_encode(['error' => 'Your account is ' . $user['status'] . '. Please contact an administrator.']);
        exit;
    }

    function get_real_ip() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) { $ip = $_SERVER['HTTP_CLIENT_IP']; }
        elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($ips[0]);
        }
        return $ip === '::1' ? '127.0.0.1' : $ip;
    }

    // ── Password verification ───────────────────────────────────────────
    if (!password_verify($password, $user['password_hash'])) {
        // Log failed attempt
        $ip = get_real_ip();
        // Use user's assigned module if not explicitly provided
        $logModule = (isset($data['module_id']) && $data['module_id'] !== '') ? (int)$data['module_id'] : ($user['module_id'] ?? 10);

        $supabase->insert('activity_logs_ums', [
            'user_id' => $user['id'],
            'event_type' => 'login',
            'module_id' => $logModule,
            'submodule_id' => $submoduleId,
            'action' => 'Failed login attempt (bad password)|' . $user['email'],
            'ip_address' => $ip
        ]);

        if ($lockoutEnabled) {
            // Count recent failed attempts in the last lockout window
            // Postgres timestamp is ISO, so we format it explicitly for PostgREST
            // We use a 5-second buffer to account for potential clock differences between PHP and DB server
            $windowStartTs = time() - ($lockoutMinutes * 60) - 5;
            $isoStart = gmdate('Y-m-d\TH:i:s\Z', $windowStartTs); 
            
            $failCount = $supabase->count('activity_logs_ums', [
                'user_id' => 'eq.' . $user['id'],
                'event_type' => 'eq.login',
                'action' => 'ilike.Failed login attempt%',
                'created_at' => 'gte.' . $isoStart
            ]);

            if ($failCount >= $maxAttempts) {
                // Suspended format lock time
                $lockedUntil = date('Y-m-d H:i:s', time() + ($lockoutMinutes * 60));
                
                $supabase->update('users_ums', [
                    'status' => 'suspended', 
                    'locked_until' => $lockedUntil
                ], ['id' => 'eq.' . $user['id']]);
                
                http_response_code(403);
                echo json_encode(['error' => "Too many failed attempts. Account locked for {$lockoutMinutes} minute(s)."]);
                exit;
            }
        }

        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }

    // ── Record session ──────────────────────────────────────────────────
    $ip           = get_real_ip();
    $ua           = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $sessionToken = bin2hex(random_bytes(32));

    // Terminate any old active sessions for this user+IP
    $supabase->update('active_sessions_ums', ['is_terminated' => 1], [
        'user_id' => 'eq.' . $user['id'],
        'ip_address' => 'eq.' . $ip
    ]);

    $supabase->insert('active_sessions_ums', [
        'user_id' => $user['id'],
        'session_token' => $sessionToken,
        'ip_address' => $ip,
        'user_agent' => $ua,
        'location' => 'Unknown'
    ]);

    // Use user's assigned module if not explicitly provided
    $logModule = (isset($data['module_id']) && $data['module_id'] !== '') ? (int)$data['module_id'] : ($user['module_id'] ?? 10);

    $supabase->insert('activity_logs_ums', [
        'user_id' => $user['id'],
        'event_type' => 'login',
        'module_id' => $logModule,
        'submodule_id' => $submoduleId,
        'action' => 'Successful login|' . $user['email'],
        'ip_address' => $ip
    ]);

    // ── 2FA: generate & send OTP ────────────────────────────────────────
    if ($twoFactorEnabled) {
        $otpCode   = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = date('Y-m-d H:i:s', time() + 300); // 5 minutes

        // Invalidate old unused OTPs for this user
        $supabase->update('user_otps_ums', ['is_used' => 1], [
            'user_id' => 'eq.' . $user['id'],
            'is_used' => 'eq.0'
        ]);

        // Insert new OTP
        $supabase->insert('user_otps_ums', [
            'user_id' => $user['id'],
            'otp_code' => $otpCode,
            'expires_at' => $expiresAt
        ]);

        // Send OTP via PHPMailer (Mailpit)
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $mailConfig['smtp_host'];
            $mail->SMTPAuth   = $mailConfig['smtp_auth'];
            $mail->Username   = $mailConfig['smtp_username'];
            $mail->Password   = $mailConfig['smtp_password'];
            $mail->SMTPSecure = $mailConfig['smtp_secure'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : ($mailConfig['smtp_secure'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : '');
            $mail->Port       = $mailConfig['smtp_port'];
            $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
            $mail->addAddress($user['email']);
            $mail->isHTML(true);
            $mail->Subject = 'Your Login Verification Code';
            $mail->Body    = "
                <h2>Verification Code</h2>
                <p>Use the code below to complete your sign-in:</p>
                <h1 style='letter-spacing:6px;font-size:36px;color:#6d28d9'>{$otpCode}</h1>
                <p>This code expires in <strong>5 minutes</strong>.</p>
                <p>If you did not request this, please ignore this email.</p>
            ";
            $mail->AltBody = "Your verification code is: {$otpCode}. It expires in 5 minutes.";
            $mail->send();
        } catch (MailException $e) {
            error_log('OTP mail error: ' . $mail->ErrorInfo);
            // Continue anyway — dev mode (Mailpit) should always accept
        }
    }

    // ── Load permissions into session ──────────────────────────────────
    load_user_permissions($user['id']);

    // ── Return success ──────────────────────────────────────────────────
    echo json_encode([
        'success'       => true,
        'user_id'       => $user['id'],
        'email'         => $user['email'],
        'full_name'     => $user['full_name'],
        'role'          => $user['role'],
        'session_token' => $sessionToken,
        'two_factor'    => $twoFactorEnabled,
        'permissions'   => $_SESSION['user_permissions'] ?? []
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
