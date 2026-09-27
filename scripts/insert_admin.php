<?php
require_once __DIR__ . '/backend/db.php';

header('Content-Type: application/json');

$supabase = get_supabase();

// Check if already exists
$existing = $supabase->select('users_ums', 'id, email, status', [
    'email' => 'ilike.yxshcw@gmail.com'
]);

if (!empty($existing) && isset($existing[0])) {
    echo json_encode([
        'verdict' => 'User already exists — no insert needed',
        'user'    => $existing[0]
    ], JSON_PRETTY_PRINT);
    exit;
}

// Insert the user
$hash = password_hash('AdminPassword123!', PASSWORD_BCRYPT);

$result = $supabase->insert('users_ums', [
    'full_name'     => 'Admin Yxshcw',
    'email'         => 'yxshcw@gmail.com',
    'role_id'       => 1,
    'password_hash' => $hash,
    'status'        => 'active'
]);

echo json_encode([
    'verdict' => 'User inserted successfully',
    'result'  => $result,
    'hash_used' => $hash
], JSON_PRETTY_PRINT);
