<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_pdo();

    // Query the password_resets_ums table joined with the users_ums table.
    // Order by the most recently requested resets first.
    // Limit to the latest 10 requests.
    $stmt = $pdo->prepare(
        'SELECT 
            pr.id, 
            u.full_name AS user_name, 
            pr.created_at, 
            pr.used_at, 
            pr.expires_at
         FROM password_resets_ums pr
         JOIN users_ums u ON pr.user_id = u.id
         ORDER BY pr.created_at DESC
         LIMIT 10'
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $recentRequests = [];
    foreach ($rows as $row) {
        $status = 'pending';
        $now = date('Y-m-d H:i:s');

        if ($row['used_at'] !== null) {
            $status = 'completed';
        } elseif ($row['expires_at'] < $now) {
            $status = 'expired';
        }

        $recentRequests[] = [
            'id' => $row['id'],
            'name' => $row['user_name'],
            'status' => $status,
            'time' => $row['created_at'] // Let frontend calculate "ago" logic
        ];
    }

    echo json_encode([
        'success' => true,
        'recent' => $recentRequests
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
