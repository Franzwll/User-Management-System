<?php

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$supabase = get_supabase();

$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$limit = isset($_GET['limit']) ? max(1, (int) $_GET['limit']) : 10;
$offset = ($page - 1) * $limit;

// Server-side filters
$filters = [];

// Filter by event type
if (isset($_GET['type']) && $_GET['type'] !== 'all') {
    $filters['event_type'] = 'eq.' . $_GET['type'];
}

// Filter by module
if (isset($_GET['module_id']) && $_GET['module_id'] !== 'all') {
    $filters['module_id'] = 'eq.' . (int)$_GET['module_id'];
}

// Filter by search query
if (isset($_GET['search']) && !empty($_GET['search'])) {
    $filters['action'] = 'ilike.*' . $_GET['search'] . '*';
}

// Fetch total count with filters via REST HEAD
$total_items = $supabase->count('activity_logs_ums', $filters);
$last_page = max(1, ceil($total_items / $limit));

// PHP-side module/submodule maps (avoids FK schema cache issues with Supabase REST joins)
$moduleNames = [
    1 => 'Student Information Management',
    2 => 'Enrollment & Registration',
    3 => 'Curriculum & Course Management',
    4 => 'Class Scheduling & Section Management',
    5 => 'Grades & Assessment Management',
    6 => 'Payment & Accounting',
    7 => 'Document & Credentials',
    8 => 'Human Resource Management',
    9 => 'Clinic & Medical Services',
    10 => 'User Management',
];

$submoduleNames = [
    1 => 'User Account Creation',
    2 => 'Role & Permission Management',
    3 => 'Authentication & Login Security',
    4 => 'User Activity Logs & Audit Trail',
    5 => 'Password Reset & Account Recovery',
    101 => 'Student Profile Registration',
    102 => 'Student Personal Information Update',
    103 => 'Academic Records Viewer',
    104 => 'Student ID Generation',
    105 => 'Student Status Tracking (Active/Alumni/Dropped)',
    106 => 'User Management (User Activity Logs & Audit Trail)',
    201 => 'Online Enrollment Application',
    202 => 'Pre-Enrollment Subject Selection',
    203 => 'Enrollment Validation & Approval',
    204 => 'Enrollment Status Monitoring',
    205 => 'Enrollment Summary Report',
    206 => 'User Management (User Activity Logs & Audit Trail)',
    301 => 'Curriculum Setup (per program/year)',
    302 => 'Course/Subject Catalog Management',
    303 => 'Prerequisite & Co-requisite Configuration',
    304 => 'Course Scheduling',
    305 => 'Curriculum Revision Management',
    306 => 'User Management (User Activity Logs & Audit Trail)',
    401 => 'Section Creation & Assignment',
    402 => 'Class Timetable Generation',
    403 => 'Room Assignment & Availability Checking',
    404 => 'Teacher Loading Management',
    405 => 'Schedule Conflict Detection',
    406 => 'User Management (User Activity Logs & Audit Trail)',
    501 => 'Grade Encoding',
    502 => 'Grade Verification & Approval',
    503 => 'Student Grade Viewer',
    504 => 'Grade Correction/Request Handling',
    505 => 'Grade Reports & Summary',
    506 => 'User Management (User Activity Logs & Audit Trail)',
    601 => 'Assessment of Fees',
    602 => 'Payment Posting & Validation',
    603 => 'Billing & Statement of Account',
    604 => 'Scholarships/Discounts Processing',
    605 => 'Financial Transactions Log',
    606 => 'User Management (User Activity Logs & Audit Trail)',
    701 => 'Document Request Module',
    702 => 'Document Processing Workflow',
    703 => 'Document Generation (PDF/Printing)',
    704 => 'Document Release Tracking',
    705 => 'Archived Records Management',
    706 => 'User Management (User Activity Logs & Audit Trail)',
    801 => 'Pre-Employment Management',
    802 => 'Recruitment & Selection Workflow',
    803 => 'Employment Records & Onboarding',
    804 => 'Employee Performance & Service Management',
    805 => 'Post-Employment & Clearance Processing',
    806 => 'User Management (User Activity Logs & Audit Trail)',
    901 => 'Student Medical Records',
    902 => 'Consultation & Treatment Logs',
    903 => 'Medicine Inventory & Dispensing',
    904 => 'Medical Clearance Issuance',
    905 => 'Health Incident Reporting',
    906 => 'User Management (User Activity Logs & Audit Trail)',
];

$logsData = $supabase->select('activity_logs_ums', 'id, event_type, module_id, submodule_id, action, ip_address, created_at, users_ums(full_name, email)', array_merge($filters, [
    'order' => 'id.desc',
    'limit' => $limit,
    'offset' => $offset
]));

$logs = is_array($logsData) && !isset($logsData['error']) ? $logsData : [];
$formatted_logs = [];

foreach ($logs as $l) {
    if (strpos($l['action'], '|') !== false) {
        $parts = explode('|', $l['action']);
        $action = $parts[0];
        $resource = $parts[1] ?? null;
    } else {
        $action = $l['action'];
        $resource = null;
    }
    
    $user_email = '(Deleted User)';
    if (!empty($l['users_ums'])) {
        $user_email = $l['users_ums']['full_name'] ?: $l['users_ums']['email'];
    }

    $formatted_logs[] = [
        'id' => $l['id'],
        'event_type' => $l['event_type'],
        'module_id' => $l['module_id'],
        'module_name' => $moduleNames[$l['module_id']] ?? null,
        'submodule_id' => $l['submodule_id'],
        'submodule_name' => $submoduleNames[$l['submodule_id']] ?? null,
        'action' => $action,
        'resource' => $resource,
        'ip_address' => $l['ip_address'],
        'created_at' => $l['created_at'],
        'user_email' => $user_email
    ];
}

echo json_encode([
    'logs' => $formatted_logs,
    'total' => $total_items,
    'page' => $page,
    'last_page' => $last_page,
    'limit' => $limit
]);

