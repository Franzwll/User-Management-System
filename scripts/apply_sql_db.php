<?php
require_once __DIR__ . '/backend/db.php';
try {
    $pdo = get_pdo();
    $sql = file_get_contents(__DIR__ . '/add_module_to_users.sql');
    $pdo->exec($sql);
    echo "SQL applied successfully.\n";
} catch (Exception $e) {
    echo "Error applying SQL: " . $e->getMessage() . "\n";
}
