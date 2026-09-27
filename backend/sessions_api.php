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
$action = $_GET['action'] ?? '';
$supabase = get_supabase();

// Helper: parse browser/OS from user-agent string
function parseBrowserOS(string $ua): string {
    $browser = 'Unknown Browser';
    $os      = 'Unknown OS';

    // Browser detection
    if (str_contains($ua, 'Edg/'))        $browser = 'Edge';
    elseif (str_contains($ua, 'OPR/') || str_contains($ua, 'Opera/')) $browser = 'Opera';
    elseif (str_contains($ua, 'Chrome/')) $browser = 'Chrome';
    elseif (str_contains($ua, 'Firefox/')) $browser = 'Firefox';
    elseif (str_contains($ua, 'Safari/') && !str_contains($ua, 'Chrome')) $browser = 'Safari';

    // OS detection
    if (str_contains($ua, 'Windows NT 10')) $os = 'Windows 10/11';
    elseif (str_contains($ua, 'Windows NT'))  $os = 'Windows';
    elseif (str_contains($ua, 'Mac OS X'))    $os = 'MacOS';
    elseif (str_contains($ua, 'iPhone'))      $os = 'iPhone';
    elseif (str_contains($ua, 'iPad'))        $os = 'iPad';
    elseif (str_contains($ua, 'Android'))     $os = 'Android';
    elseif (str_contains($ua, 'Linux'))       $os = 'Linux';

    return "$browser on $os";
}

try {
    if ($method === 'GET') {
        // List all active (non-terminated) sessions with user info
        $eightHoursAgo = date('c', time() - (8 * 3600));
        $sessionsData = $supabase->select('active_sessions_ums', 'id, user_id, ip_address, user_agent, location, started_at, last_activity, session_token, users_ums(full_name, email)', [
            'is_terminated' => 'eq.0',
            'last_activity' => 'gte.' . $eightHoursAgo,
            'order'         => 'last_activity.desc'
        ]);

        $rows = (is_array($sessionsData) && !isset($sessionsData['error'])) ? $sessionsData : [];

        $sessions = array_map(function ($r) {
            return [
                'id'            => (int)$r['id'],
                'user_id'       => (int)$r['user_id'],
                'email'         => $r['users_ums']['email'] ?? '',
                'name'          => $r['users_ums']['full_name'] ?? '',
                'browser_os'    => parseBrowserOS($r['user_agent'] ?? ''),
                'ip_address'    => $r['ip_address'],
                'location'      => $r['location'] ?? 'Unknown',
                'started_at'    => $r['started_at'],
                'last_activity' => $r['last_activity'],
            ];
        }, $rows);

        echo json_encode(['success' => true, 'sessions' => $sessions, 'count' => count($sessions)]);

    } elseif ($method === 'POST') {
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];

        if ($action === 'terminate') {
            $id = (int)($data['id'] ?? 0);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Session ID required']);
                exit;
            }
            $supabase->update('active_sessions_ums', ['is_terminated' => 1], ['id' => 'eq.' . $id]);
            echo json_encode(['success' => true]);

        } elseif ($action === 'terminate_all') {
            // Optionally exclude the current admin session by token
            $excludeToken = $data['current_token'] ?? '';
            if ($excludeToken) {
                $supabase->update('active_sessions_ums', ['is_terminated' => 1], [
                    'session_token' => 'neq.' . $excludeToken,
                    'is_terminated' => 'eq.0'
                ]);
            } else {
                $supabase->update('active_sessions_ums', ['is_terminated' => 1], ['is_terminated' => 'eq.0']);
            }
            echo json_encode(['success' => true]);

        } elseif ($action === 'record') {
            // Called from login.php after successful login
            $userId    = (int)($data['user_id'] ?? 0);
            $ip        = $data['ip_address'] ?? '';
            $ua        = $data['user_agent'] ?? '';
            $location  = $data['location'] ?? 'Unknown';
            $token     = $data['session_token'] ?? bin2hex(random_bytes(32));

            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'user_id required']);
                exit;
            }

            // Terminate old sessions from same user+IP
            $supabase->update('active_sessions_ums', ['is_terminated' => 1], [
                'user_id' => 'eq.' . $userId,
                'ip_address' => 'eq.' . $ip
            ]);

            $supabase->insert('active_sessions_ums', [
                'user_id' => $userId,
                'session_token' => $token,
                'ip_address' => $ip,
                'user_agent' => $ua,
                'location' => $location
            ]);

            echo json_encode(['success' => true, 'session_token' => $token]);

        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'details' => $e->getMessage()]);
}
