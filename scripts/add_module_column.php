<?php
require_once __DIR__ . '/backend/config.php';

function get_pdo() {
    $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        return $pdo;
    } catch (PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
}

try {
    $pdo = get_pdo();
    echo "Adding module_id column to users_ums...\n";
    $pdo->exec("ALTER TABLE users_ums ADD COLUMN IF NOT EXISTS module_id INT NULL REFERENCES modules_ums(id) ON DELETE SET NULL");
    echo "Success!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
