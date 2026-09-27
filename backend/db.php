<?php

date_default_timezone_set('Asia/Manila');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/supabase_api.php';

/**
 * Returns a singleton instance of SupabaseRestApi.
 * @param bool $serviceRole Whether to use the service role key (bypasses RLS).
 */
function get_supabase($serviceRole = false): SupabaseRestApi
{
    static $anon = null;
    static $service = null;

    if ($serviceRole) {
        if ($service === null) $service = new SupabaseRestApi(true);
        return $service;
    }

    if ($anon === null) $anon = new SupabaseRestApi(false);
    return $anon;
}

/**
 * Returns a PDO instance for direct database access.
 * Use this ONLY for administrative tasks that require RLS bypass (e.g. user management).
 */
function get_pdo(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        header('Content-Type: application/json');
        http_response_code(503);
        echo json_encode([
            'error'   => 'Direct database connection failed',
            'details' => $e->getMessage(),
        ]);
        exit;
    }

    return $pdo;
}

