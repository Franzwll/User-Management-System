<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
echo json_encode([
    'url'     => SUPABASE_URL,
    'anonKey' => SUPABASE_ANON_KEY
]);
