<?php
/**
 * Authentication and Authorization Helper
 * Implementation of the approved UMS Scope.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Checks if the current user has a specific permission.
 * 
 * @param string $permission The permission name (e.g., 'Users:Create')
 * @param bool $force_reload Whether to re-fetch from DB (optional)
 * @return bool
 */
function has_permission($permission, $force_reload = false) {
    if ($force_reload) {
        $uid = $_SESSION['user_id'] ?? null;
        if ($uid) load_user_permissions($uid);
    }

    $permissions = $_SESSION['user_permissions'] ?? [];
    
    // Administrator role usually has all permissions
    if (($_SESSION['role_name'] ?? '') === 'Administrator') {
        return true;
    }
    
    return in_array($permission, $permissions);
}

/**
 * Checks if the current user has a specific role.
 * 
 * @param string $role_name The role name (e.g., 'Registrar')
 * @return bool
 */
function has_role($role_name) {
    return ($_SESSION['role_name'] ?? '') === $role_name;
}

/**
 * Require a specific permission to continue. 
 * Redirects or exits if not permitted.
 * 
 * @param string $permission
 */
function require_permission($permission) {
    if (!has_permission($permission)) {
        http_response_code(403);
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
            echo json_encode(['error' => 'Permission denied: ' . $permission]);
        } else {
            echo "<h1>403 Forbidden</h1><p>You do not have permission to perform this action ($permission).</p>";
        }
        exit;
    }
}

/**
 * Loads and caches user permissions into the session.
 * 
 * @param int $user_id
 */
function load_user_permissions($user_id) {
    if (!$user_id) return;
    
    require_once __DIR__ . '/db.php';
    $supabase = get_supabase();
    
    // Get role name and permissions in one or two queries
    $userData = $supabase->select('users_ums', 'role_id, roles_ums(name)', ['id' => 'eq.' . $user_id]);
    
    if (is_array($userData) && isset($userData[0])) {
        $_SESSION['role_id'] = $userData[0]['role_id'];
        $_SESSION['role_name'] = $userData[0]['roles_ums']['name'] ?? 'User';
        
        $permsData = $supabase->select('role_permissions_ums', 'permissions_ums(name)', [
            'role_id' => 'eq.' . $userData[0]['role_id']
        ]);
        
        $permissions = [];
        if (is_array($permsData) && !isset($permsData['error'])) {
            foreach ($permsData as $p) {
                if (isset($p['permissions_ums']['name'])) {
                    $permissions[] = $p['permissions_ums']['name'];
                }
            }
        }
        $_SESSION['user_permissions'] = $permissions;
    }
}

/**
 * Formats a permission name for consistency.
 * 
 * @param string $module
 * @param string $action
 * @return string
 */
function format_permission($module, $action) {
    return ucfirst($module) . ':' . ucfirst($action);
}
