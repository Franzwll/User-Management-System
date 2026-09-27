<?php

require_once __DIR__ . '/config.php';

/**
 * SupabaseRestApi
 * A simple helper to interact with Supabase via REST API (Port 443).
 * Useful when direct PostgreSQL ports (5432/6543) are blocked.
 */
class SupabaseRestApi {
    private $url;
    private $apiKey;

    public function __construct($useServiceRole = false) {
        $this->url = rtrim(SUPABASE_URL, '/');
        $this->apiKey = ($useServiceRole && defined('SUPABASE_SERVICE_ROLE_KEY') && SUPABASE_SERVICE_ROLE_KEY) 
            ? SUPABASE_SERVICE_ROLE_KEY 
            : SUPABASE_ANON_KEY;
    }

    /**
     * Perform a GET request to a table
     */
    public function select($table, $select = '*', $filters = []) {
        $query = http_build_query(array_merge(['select' => $select], $filters));
        return $this->request('GET', "/rest/v1/$table?$query");
    }

    /**
     * Perform an INSERT request
     */
    public function insert($table, $data) {
        return $this->request('POST', "/rest/v1/$table", $data, [
            'Prefer: return=representation'
        ]);
    }

    /**
     * Perform an UPDATE request
     */
    public function update($table, $data, $filters = []) {
        $query = http_build_query($filters);
        return $this->request('PATCH', "/rest/v1/$table?$query", $data);
    }

    /**
     * Perform an UPSERT request
     */
    public function upsert($table, $data, $onConflict = 'id') {
        $query = http_build_query(['on_conflict' => $onConflict]);
        return $this->request('POST', "/rest/v1/$table?$query", $data, [
            'Prefer: resolution=merge-duplicates, return=representation'
        ]);
    }

    /**
     * Perform a COUNT request using HEAD
     */
    public function count($table, $filters = []) {
        $query = http_build_query($filters);
        $ch = curl_init($this->url . "/rest/v1/$table" . ($query ? "?$query" : ''));
        
        $headers = [
            'apikey: ' . $this->apiKey,
            'Authorization: Bearer ' . $this->apiKey,
            'Prefer: count=exact',
            'Accept-Profile: public',
            'Content-Profile: public'
        ];

        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'HEAD');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        if (preg_match('/Content-Range:.*\/(\d+)/i', $response, $matches)) {
            return (int)$matches[1];
        }
        return 0;
    }

    /**
     * Perform a DELETE request
     */
    public function delete($table, $filters = []) {
        $query = http_build_query($filters);
        return $this->request('DELETE', "/rest/v1/$table?$query");
    }

    /**
     * Upload a file to Supabase Storage
     */
    public function uploadFile($bucket, $path, $filePath, $contentType = null) {
        if (!file_exists($filePath)) {
            throw new Exception("File not found: $filePath");
        }

        $filename = basename($path);
        // Use service role key for storage for administrative uploads (bypasses RLS)
        $uploadKey = (defined('SUPABASE_SERVICE_ROLE_KEY') && SUPABASE_SERVICE_ROLE_KEY) 
            ? SUPABASE_SERVICE_ROLE_KEY 
            : $this->apiKey;

        $url = $this->url . "/storage/v1/object/$bucket/$path";
        
        $ch = curl_init($url);
        
        $headers = [
            'apikey: ' . $uploadKey,
            'Authorization: Bearer ' . $uploadKey,
        ];

        if ($contentType) {
            $headers[] = 'Content-Type: ' . $contentType;
        } else {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $filePath);
            finfo_close($finfo);
            $headers[] = 'Content-Type: ' . $mime;
        }

        $fileData = file_get_contents($filePath);

        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $fileData);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("Supabase Storage Error: " . $error);
        }

        $decoded = json_decode($response, true);
        if ($httpCode >= 400) {
            $msg = $decoded['message'] ?? $decoded['error'] ?? 'Unknown storage error';
            throw new Exception("Supabase Storage HTTP $httpCode: $msg");
        }

        // Return the public URL
        return $this->url . "/storage/v1/object/public/$bucket/$path";
    }

    /**
     * Internal request handler
     */
    private function request($method, $path, $data = null, $extraHeaders = []) {
        $ch = curl_init($this->url . $path);
        
        $headers = array_merge([
            'apikey: ' . $this->apiKey,
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json',
            'Accept-Profile: public',
            'Content-Profile: public'
        ], $extraHeaders);

        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Supabase API Error: " . $error);
        }

        $decoded = json_decode($response, true);
        
        if ($httpCode >= 400) {
            $msg = $decoded['message'] ?? 'Unknown error';
            throw new Exception("Supabase API HTTP $httpCode: $msg");
        }

        return $decoded;
    }
}
