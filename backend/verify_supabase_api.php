<?php

require_once __DIR__ . '/supabase_api.php';

try {
    $api = new SupabaseRestApi();
    
    echo "Testing Supabase REST API Bridge (Port 443)...\n";
    
    // Attempt to fetch one user
    $users = $api->select('users_ums', '*', ['limit' => 1]);
    
    echo "Success! Connected to Supabase via REST API.\n";
    echo "Data received:\n";
    print_r($users);
    
} catch (Exception $e) {
    echo "Verification Failed: " . $e->getMessage() . "\n";
}
