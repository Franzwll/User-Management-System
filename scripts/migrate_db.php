<?php
require_once __DIR__ . '/backend/db.php';

try {
    $pdo = get_pdo();

    echo "Adding 'locked_until' column and updating 'status' enum to the users table...\n";

    // Add 'locked_until' column if it doesn't exist
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_map(function($c) { return $c['Field']; }, $columns);

    if (!in_array('locked_until', $columnNames)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN locked_until DATETIME NULL AFTER status");
        echo "Column 'locked_until' added.\n";
    } else {
        echo "Column 'locked_until' already exists.\n";
    }

    // Update 'status' enum
    $pdo->exec("ALTER TABLE users MODIFY COLUMN status ENUM('active','inactive','pending','suspended') NOT NULL DEFAULT 'active'");
    echo "Status enum updated to include 'suspended'.\n";

    echo "Migration completed successfully.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
