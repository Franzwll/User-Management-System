<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';
$mailConfig = require __DIR__ . '/config/mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Actor-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$actor_id = $_SERVER['HTTP_X_ACTOR_ID'] ?? null;
$actor_id = ($actor_id !== null && $actor_id !== '' && $actor_id !== 'null') ? (int)$actor_id : null;

if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid user_id is required']);
    exit;
}

try {
    $supabase = get_supabase(true);

    // Verify user exists and get info for logging/email
    $userResult = $supabase->select('users_ums', 'full_name, email', ['id' => 'eq.' . $user_id]);
    
    if (empty($userResult) || isset($userResult['error']) || !isset($userResult[0])) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    $user = $userResult[0];

    // Generate 8-character verification code (consistent with reset UI)
    $token = substr(str_shuffle(str_repeat('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)), 0, 8);
    $expiry = date('c', strtotime('+24 hours')); // ISO 8601 for Supabase

    // Insert into password_resets_ums
    $supabase->insert('password_resets_ums', [
        'user_id' => $user_id,
        'token' => $token,
        'expires_at' => $expiry
    ]);

    // Send Email via PHPMailer
    $mail = new PHPMailer(true);
    $mailError = null;

    try {
        $mail->isSMTP();
        $mail->Host       = $mailConfig['smtp_host'];
        $mail->SMTPAuth   = $mailConfig['smtp_auth'];
        $mail->Username   = $mailConfig['smtp_username'];
        $mail->Password   = $mailConfig['smtp_password'];
        $mail->SMTPSecure = $mailConfig['smtp_secure'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : ($mailConfig['smtp_secure'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : '');
        $mail->Port       = $mailConfig['smtp_port'];

        $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
        $mail->addAddress($user['email']);

        $resetLink = $mailConfig['reset_base_url'] . '?token=' . $token;
        $mail->isHTML(true);
        $mail->Subject = 'Password Reset Requested - User Management System';
        $mail->Body    = "
            <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h2 style='color: #6d28d9;'>Password Reset Requested</h2>
                <p>Hi <strong>{$user['full_name']}</strong>,</p>
                <p>An administrator has requested a password reset for your account. Use the code below to set a new password:</p>
                <div style='background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                    <h1 style='letter-spacing: 6px; font-size: 36px; color: #6d28d9; margin: 0;'>{$token}</h1>
                </div>
                <p>Alternatively, you can click the button below to reset your password directly:</p>
                <div style='text-align: center;'>
                    <a href='$resetLink' style='display: inline-block; padding: 12px 24px; background-color: #6d28d9; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>Reset Password</a>
                </div>
                <p style='margin-top: 20px; font-size: 13px; color: #666;'>This code is valid for 24 hours. If you did not request this, please contact your system administrator.</p>
            </div>
        ";
        $mail->AltBody = "Your password recovery code is: {$token}\nYou can also use this link: $resetLink";

        $mail->send();
    } catch (Exception $e) {
        $mailError = "Email sending failed: " . $mail->ErrorInfo;
        error_log($mailError);
    }

    // Log the event
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $supabase->insert('activity_logs_ums', [
        'user_id'    => $actor_id ?: $user_id,
        'event_type' => 'password',
        'module_id'  => 10,
        'submodule_id'  => 5,
        'action'     => 'Password reset triggered via Admin|' . $user['email'],
        'ip_address' => $ip,
    ]);

    echo json_encode([
        'success' => true,
        'message' => $mailError ? 'Token generated but email failed.' : 'Password reset email sent successfully',
        'details' => $mailError,
        'token'   => $token
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
