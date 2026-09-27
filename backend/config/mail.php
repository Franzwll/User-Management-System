<?php
// backend/config/mail.php

return [
    'smtp_host'       => getenv('SMTP_HOST') ?: 'localhost',              // Defaults to Mailpit if not set
    'smtp_auth'       => getenv('SMTP_USER') ? true : false,              // Auth needed for real SMTP
    'smtp_username'   => getenv('SMTP_USER') ?: '',                       
    'smtp_password'   => getenv('SMTP_PASS') ?: '',                       
    'smtp_secure'     => getenv('SMTP_SECURE') ?: '',                     // E.g., 'tls' or 'ssl'
    'smtp_port'       => getenv('SMTP_PORT') ?: 1025,                     
    'from_email'      => getenv('SMTP_FROM_EMAIL') ?: 'noreply@university.edu',
    'from_name'       => getenv('SMTP_FROM_NAME') ?: 'User Management System',
    'reset_base_url'  => (defined('BASE_URL') ? BASE_URL : 'http://localhost/New%20folder') . '/login/reset.html'
];
