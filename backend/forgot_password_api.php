<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../vendor/autoload.php';
$mailConfig = require_once __DIR__ . '/config/mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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

$email = isset($data['email']) ? trim($data['email']) : '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

try {
    $supabase = get_supabase(true);

    // Find user by email
    $usersData = $supabase->select('users_ums', 'id, email', ['email' => 'eq.' . $email]);

    if (empty($usersData) || isset($usersData['error']) || !isset($usersData[0])) {
        // For security, don't reveal if user exists. 
        echo json_encode([
            'success' => true,
            'message' => 'If an account exists with that email, a reset link has been sent.'
        ]);
        exit;
    }

    $user = $usersData[0];

    // Generate 8-character verification code
    $token = substr(str_shuffle(str_repeat('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)), 0, 8);
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token valid for 1 hour

    // Insert into password_resets_ums
    $supabase->insert('password_resets_ums', [
        'user_id' => $user['id'],
        'token' => $token,
        'expires_at' => $expiry
    ]);

    // Send Email via PHPMailer
    $mail = new PHPMailer(true);

    try {
        //Server settings
        $mail->isSMTP();
        $mail->Host       = $mailConfig['smtp_host'];
        $mail->SMTPAuth   = $mailConfig['smtp_auth'];
        $mail->Username   = $mailConfig['smtp_username'];
        $mail->Password   = $mailConfig['smtp_password'];
        $mail->SMTPSecure = $mailConfig['smtp_secure'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : ($mailConfig['smtp_secure'] === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : '');
        $mail->Port       = $mailConfig['smtp_port'];

        //Recipients
        $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
        $mail->addAddress($user['email']);

        //Content
        $resetLink = $mailConfig['reset_base_url'] . '?token=' . $token;
        $mail->isHTML(true);
        $mail->Subject = 'Password Recovery Code - User Management System';
        $mail->Body    = "
            <h2>Password Recovery Code</h2>
            <p>You requested a password reset for your account. Use the code below to set a new password:</p>
            <h1 style='letter-spacing:6px;font-size:36px;color:#6d28d9'>{$token}</h1>
            <p>You can also click this link to automatically fill the code: <br> <a href='$resetLink'>$resetLink</a></p>
            <p>This code will expire in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
        ";
        $mail->AltBody = "Your password recovery code is: {$token}\nYou can also use this link: $resetLink";

        $mail->send();
    } catch (Exception $e) {
        // In production, you might log this error but still return success to the user
        // for security reasons or to not expose server details.
        error_log("PHPMailer Error: " . $mail->ErrorInfo);
    }

    // Log the event
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $supabase->insert('activity_logs_ums', [
        'user_id' => $user['id'],
        'event_type' => 'password',
        'action' => 'Password recovery requested via email',
        'ip_address' => $ip
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'If an account exists with that email, a reset link has been sent.'
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
