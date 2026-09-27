<?php
require_once __DIR__ . '/backend/db.php';
require_once __DIR__ . '/backend/auth_helper.php';

// Mock a login session for testing
$_SESSION['user_id'] = 1;

echo "--- UMS Scope Verification ---\n";

try {
    echo "Loading permissions for User ID 1...\n";
    load_user_permissions(1);
    
    $role = $_SESSION['role_name'] ?? 'None';
    $perms = $_SESSION['user_permissions'] ?? [];
    
    echo "Role: $role\n";
    echo "Permissions Count: " . count($perms) . "\n";
    echo "Permissions List: " . implode(', ', $perms) . "\n\n";
    
    echo "Testing has_permission()...\n";
    
    $tests = [
        'Users:Create',
        'Grades:Manage',
        'NonExistent:Action'
    ];
    
    foreach ($tests as $t) {
        $result = has_permission($t) ? 'GRANTED' : 'DENIED';
        echo "Check [$t]: $result\n";
    }
    
    echo "\nVerification Complete.\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
