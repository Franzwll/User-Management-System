<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$supabase = get_supabase();

try {
    if ($method === 'GET') {
        $settingsData = $supabase->select('auth_settings_ums', 'setting_key, setting_value');
        $settings = [];
        if (is_array($settingsData) && !isset($settingsData['error'])) {
            foreach ($settingsData as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
        }
        echo json_encode($settings);
    } elseif ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        
        if (!isset($data['key']) || !isset($data['value'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Key and value are required']);
            exit;
        }

        $supabase->upsert('auth_settings_ums', [
            'setting_key' => $data['key'],
            'setting_value' => (string)$data['value']
        ], 'setting_key');

        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
