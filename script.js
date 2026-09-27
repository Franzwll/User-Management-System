// ── DATA ──
// Start empty; will be populated from backend/users.php
let users = [];
let apiRoles = [];
let apiPermissions = [];
let selectedRoleId = null;
let selectedRolePermissions = [];

const roleIcons = {
  'Administrator': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l2 15h16L22 7z"/><path d="M12 2l3 5-3 2-3-2 3-5z"/></svg>',
  'Registrar': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  'Faculty': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-1H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-1h7z"/></svg>',
  'Staff': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="8" r="4"/><line x1="12" y1="14" x2="12" y2="22"/></svg>',
  'Student': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7"/><path d="M5 10v6a7 7 0 0 0 14 0v-6"/><path d="M19 7v9"/></svg>',
  'Clinic Staff': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
};

const roleColors = {
  'Administrator': 'var(--accent)',
  'Registrar': 'var(--blue)',
  'Faculty': 'var(--purple)',
  'Staff': 'var(--amber)',
  'Student': 'var(--red)',
  'Clinic Staff': '#14b8a6'
};

const roleCls = {
  'Administrator': 'rc-1',
  'Registrar': 'rc-2',
  'Faculty': 'rc-3',
  'Staff': 'rc-4',
  'Student': 'rc-5',
  'Clinic Staff': 'rc-6'
};

let logs = [];
const authSettings = [
  { key: 'two_factor_auth', ico: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', color: 'var(--accent-dim)', title: 'Two-Factor Authentication', on: true, body: 'Require 2FA for all admin and registrar accounts via authenticator app or SMS OTP.' },
  { key: 'account_lockout', ico: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>', color: 'var(--red-dim)', title: 'Account Lockout Policy', on: true, body: 'Lock account temporarily after failed login attempts.', showInput: true, inputVal: '5', inputLabel: 'Max Attempts', showDuration: true, durationVal: '15' },
  { key: 'login_monitoring', ico: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>', color: 'var(--amber-dim)', title: 'Login Monitoring', on: true, body: 'Real-time alerts and monitoring for suspicious login activity across all accounts.' },
  { key: 'password_policy', ico: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>', color: 'rgba(20,184,166,.15)', title: 'Password Policy', on: true, body: '<strong>Min Length:</strong> 8 chars, must include uppercase, lowercase, number, and special character.' }
];
const recoveryData = {
  process: [
    { ico: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', txt: 'User submits password reset via email link' },
    { ico: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>', txt: 'OTP sent to registered email / phone' },
    { ico: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', txt: 'New password set with policy enforcement' },
    { ico: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', txt: 'Reset event logged in audit trail' }
  ],
  recent: [],
  settings: {
    link_expiry: '24',
    max_otp: '3',
    backup_email: true
  }
};

// ── STATE ──
let activeCtxUserId = -1;
let dashboardStatusFilter = 'all';
let dashboardTypeFilter = 'all';
let usersRoleFilter = 'all';
let usersSearchQuery = '';
let currentUsersPage = 1;
let usersSortBy = '';   // 'id' | 'name' | 'email'
let usersSortDir = 1;  // 1 = asc (A-Z, low-high), -1 = desc
let dashboardUserListRole = 'all';
let currentLogPage = 1;
let logTotalPages = 1;
let currentLogFilter = 'all';
let currentLogModuleFilter = 'all';
let logsSearchQuery = '';

const MODULE_NAMES = {
  1: 'Student Information Management',
  2: 'Enrollment & Registration',
  3: 'Curriculum & Course Management',
  4: 'Class Scheduling & Section Management',
  5: 'Grades & Assessment Management',
  6: 'Payment & Accounting',
  7: 'Document & Credentials',
  8: 'Human Resource Management',
  9: 'Clinic & Medical Services',
  10: 'User Management'
};

function searchLogs(query) {
  logsSearchQuery = query.toLowerCase().trim();
  currentLogPage = 1;
  loadLogsFromApi(1);
}

function filterLogByModule(moduleId) {
  currentLogModuleFilter = moduleId;
  currentLogPage = 1;
  loadLogsFromApi(1);
}

// ── LOGGING HELPER ──
function logActivity(type, action, moduleId = null, submoduleId = null) {
  const userId = sessionStorage.getItem('ums-user-id');
  if (!userId) return;

  fetch('backend/log_event.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      event_type: type,
      action: action,
      module_id: moduleId,
      submodule_id: submoduleId
    })
  }).catch(e => console.warn('Activity logging failed', e));
}

// ── THEME TOGGLING ──
const THEME_KEY = 'ums-theme';

function applyTheme(theme) {
  const root = document.documentElement;
  const mode = theme === 'light' ? 'light' : 'dark';
  if (mode === 'light') {
    root.setAttribute('data-theme', 'light');
    if (document.getElementById('nav-logo')) {
      document.getElementById('nav-logo').src = 'assets/images/badge_1.png';
    }
  } else {
    root.removeAttribute('data-theme');
    if (document.getElementById('nav-logo')) {
      document.getElementById('nav-logo').src = 'assets/images/badge_2.png';
    }
  }
  const toggles = document.querySelectorAll('[data-role="theme-toggle"]');
  toggles.forEach(function (btn) {
    if (mode === 'light') {
      btn.textContent = '☾';
      btn.title = 'Switch to dark mode';
    } else {
      btn.textContent = '☀';
      btn.title = 'Switch to light mode';
    }
  });
}

function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (e) { }
  if (!stored) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      stored = 'light';
    } else {
      stored = 'dark';
    }
  }
  applyTheme(stored);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) { }
  applyTheme(next);
}

// ── DASHBOARD HELPERS ──
function isFaculty(role) {
  return role && ['Administrator', 'Registrar', 'Faculty', 'Staff'].indexOf(role) >= 0;
}
function getDashboardCounts() {
  var total = users.length;
  var active = users.filter(function (u) { return u.status === 'active'; }).length;
  var inactive = users.filter(function (u) { return u.status === 'inactive'; }).length;
  var pending = users.filter(function (u) { return u.status === 'pending'; }).length;
  var suspended = users.filter(function (u) { return u.status === 'suspended'; }).length;
  var students = users.filter(function (u) { return u.role === 'Student'; }).length;
  var faculty = users.filter(function (u) { return u.role === 'Faculty'; }).length;
  var staff = users.filter(function (u) { return u.role === 'Staff'; }).length;
  var registrar = users.filter(function (u) { return u.role === 'Registrar'; }).length;
  var administrator = users.filter(function (u) { return u.role === 'Administrator'; }).length;
  return { total: total, active: active, inactive: inactive, pending: pending, suspended: suspended, students: students, faculty: faculty, staff: staff, registrar: registrar, administrator: administrator };
}

function updateNavCounts() {
  var acc = document.getElementById('navAccountsCount');
  if (acc) acc.textContent = users.length;
  var rl = document.getElementById('navRolesCount');
  if (rl) rl.textContent = apiRoles.length;
  var lg = document.getElementById('navLogsCount');
  if (lg) lg.textContent = logs.length;
  var rc = document.getElementById('navRecoveryCount');
  if (rc && recoveryData && recoveryData.recent) rc.textContent = recoveryData.recent.length;
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── NAVIGATION ──
function setNav(el, page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('show'));
  document.getElementById('page-' + page).classList.add('show');

  if (page === 'dashboard') renderDashboard();
  if (page === 'accounts') renderUsers();
  if (page === 'roles') renderRoles();
  if (page === 'auth') renderAuth();
  if (page === 'logs') renderLogs();
  if (page === 'recovery') loadRecoveryData();
}

// ── RENDER DASHBOARD ──
function renderDashboard() {
  var c = getDashboardCounts();
  var navDash = document.getElementById('navDashCount');
  if (navDash) navDash.textContent = c.total;
  updateNavCounts();

  var dashEl = document.getElementById('page-dashboard');
  if (!dashEl) return;
  var cards = [
    { label: 'Total Users', num: c.total, cls: 'accent', role: 'all' },
    { label: 'Students', num: c.students, cls: 'red', role: 'Student' },
    { label: 'Faculty', num: c.faculty, cls: 'purple', role: 'Faculty' },
    { label: 'Staff', num: c.staff, cls: 'amber', role: 'Staff' },
    { label: 'Registrar', num: c.registrar, cls: 'blue', role: 'Registrar' },
    { label: 'Administrator', num: c.administrator, cls: 'accent', role: 'Administrator' },
    { label: 'Suspended', num: c.suspended, cls: 'red', role: 'suspended' }
  ];
  var html = '<div class="ph"><div class="ph-left"><div class="ph-title">Dashboard</div><div class="ph-sub">Overview by user role</div></div></div>';
  html += '<div class="dashboard-stats">';
  cards.forEach(function (card, i) {
    html += '<div class="stat-card ' + card.cls + ' anim d' + (i % 5 + 1) + '">';
    html += '<div class="stat-num">' + card.num + '</div>';
    html += '<div class="stat-label">' + card.label + '</div></div>';
  });
  html += '</div>';

  // ── 2-COLUMN: User List + Activity/Security ──
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px">';

  // LEFT: User List box
  html += '<div style="background:var(--surface1);border:1px solid var(--border);border-radius:12px;overflow:hidden">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px">'
    + '<div><div style="font-size:14px;font-weight:700;color:var(--text-main)">User <span style="color:var(--accent)">List</span></div>'
    + '<div style="font-size:11px;color:var(--text-dim);margin-top:1px">Recent users in the system</div></div>'
    + '<button class="btn btn-ghost" style="font-size:11px;padding:4px 10px" onclick="goToAccountsByRole(\'all\')">View all</button>'
    + '</div>';
  html += '<div id="dashboardUserList"></div>';
  html += '</div>';

  // RIGHT column: Recent Activities + Security Alerts + Quick Actions
  html += '<div style="display:flex;flex-direction:column;gap:14px">';

  // Recent Activities panel
  html += '<div style="background:var(--surface1);border:1px solid var(--border);border-radius:12px;overflow:hidden">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px">'
    + '<div style="display:flex;align-items:center;gap:7px">'
    + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-mid)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    + '<span style="font-size:13px;font-weight:700;color:var(--text-main)">Recent Activities</span></div>'
    + '</div>';
  if (logs.length === 0) {
    html += '<div style="padding:16px;text-align:center;color:var(--text-dim);font-size:12px">No recent activity.</div>';
  } else {
    var typeColors = {
      login: { bg: 'rgba(139,92,246,.18)', text: '#a78bfa' },
      create: { bg: 'rgba(34,197,94,.18)', text: '#4ade80' },
      update: { bg: 'rgba(59,130,246,.18)', text: '#60a5fa' },
      delete: { bg: 'rgba(239,68,68,.18)', text: '#f87171' },
      password: { bg: 'rgba(245,158,11,.18)', text: '#fbbf24' },
      access: { bg: 'rgba(20,184,166,.18)', text: '#14b8a6' }
    };
    logs.slice(0, 4).forEach(function (l) {
      var tc = typeColors[(l.type || '').toLowerCase()] || { bg: 'rgba(255,255,255,.08)', text: 'var(--text-mid)' };
      var timeAgo = getTimeAgo(l.time);
      html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 14px;border-top:1px solid var(--border)">'
        + '<span style="flex-shrink:0;margin-top:2px;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700;background:' + tc.bg + ';color:' + tc.text + '">' + (l.type || '?') + '</span>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:12px;font-weight:600;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (l.user || '—') + '</div>'
        + '<div style="font-size:11px;color:var(--text-dim);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (l.action || '—') + '</div>'
        + '<div style="font-size:10px;color:var(--text-dim);margin-top:2px">' + timeAgo + '</div>'
        + '</div></div>';
    });
  }
  html += '</div>';

  // Security Alerts panel
  var securityAlerts = logs.filter(function (l) {
    return l.action === 'Multiple Attempts' || (l.fullAction || '').toLowerCase().indexOf('failed login attempt (') !== -1;
  }).slice(0, 2);

  html += '<div style="background:var(--surface1);border:1px solid var(--border);border-radius:12px;overflow:hidden">';
  html += '<div style="display:flex;align-items:center;gap:7px;padding:14px 16px 10px">'
    + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    + '<span style="font-size:13px;font-weight:700;color:var(--text-main)">Security Alerts</span>'
    + '</div>';
  if (securityAlerts.length === 0) {
    html += '<div style="padding:6px 16px 14px;font-size:12px;color:var(--text-dim)">No security alerts.</div>';
  } else {
    securityAlerts.forEach(function (l) {
      var timeAgo = getTimeAgo(l.time);
      html += '<div style="margin:0 12px 8px;padding:9px 11px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.18);border-radius:8px">'
        + '<div style="display:flex;justify-content:space-between;margin-bottom:3px">'
        + '<span style="font-size:10px;font-weight:700;color:var(--red);letter-spacing:.5px">HIGH</span>'
        + '<span style="font-size:10px;color:var(--text-dim)">' + timeAgo + '</span>'
        + '</div>'
        + '<div style="font-size:12px;font-weight:600;color:var(--text-main)">Failed login attempts detected</div>'
        + '<div style="font-size:11px;color:var(--text-dim);margin-top:2px">User: ' + (l.user || 'unknown') + '</div>'
        + '</div>';
    });
  }
  html += '</div>';

  html += '</div>'; // end right column
  html += '</div>'; // end grid

  dashEl.innerHTML = html;
  renderDashboardUserList();
}
function filterDashboardUserList(role, el) {
  dashboardUserListRole = role || 'all';
  var wrap = document.getElementById('dashboardUserListTabs');
  if (wrap) {
    var tabs = wrap.querySelectorAll('.tab');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    if (el) el.classList.add('active');
  }
  renderDashboardUserList();
}
function renderDashboardUserList() {
  // Start from a fresh copy so sorting doesn't mutate the original users array
  var list = dashboardUserListRole === 'all'
    ? users.slice()
    : users.filter(function (u) { return u.role === dashboardUserListRole; });

  // Show most recently added users first (higher id = newer)
  list.sort(function (a, b) {
    return (b.id || 0) - (a.id || 0);
  });

  // Limit to the latest 8 users
  list = list.slice(0, 8);
  var container = document.getElementById('dashboardUserList');
  if (!container) return;
  var h = '<div style="display:grid;grid-template-columns:1fr 1fr 90px;padding:8px 14px;border-bottom:1px solid var(--border);font-size:11px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;"><span>User</span><span>Email</span><span>Role</span></div>';
  list.forEach(function (u, i) {
    h += '<div class="table-row anim d' + (i % 5 + 1) + ' dashboard-user-row" style="display:grid;grid-template-columns:1fr 1fr 90px;align-items:center;padding:9px 14px;border-top:1px solid var(--border);cursor:default;">'
      + '<div style="display:flex;align-items:center;gap:8px;min-width:0;"><div class="tr-avatar" style="flex-shrink:0;background:' + u.color + ';color:#1a1a1a">' + (u.avatar_url ? '<img src="' + u.avatar_url + '" alt="Avatar"/>' : u.initials) + '</div>'
      + '<div style="min-width:0;"><div style="font-size:12px;font-weight:600;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + u.name + '</div>'
      + '<div style="font-size:10px;color:var(--text-dim);">ID-' + u.id.toString().padStart(3, '0') + '</div></div></div>'
      + '<div style="font-size:11px;color:var(--text-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">' + u.email + '</div>'
      + '<div class="tr-role" style="font-size:11px;">' + u.role + '</div>'
      + '</div>';
  });
  container.innerHTML = h;
}
function goToAccountsByRole(role) {
  setNav(document.querySelector('.nav-item[onclick*="accounts"]'), 'accounts');
  usersRoleFilter = role;
  var tabs = document.querySelectorAll('#page-accounts .tabs .tab');
  tabs.forEach(function (t) {
    t.classList.remove('active');
    if ((t.getAttribute('onclick') || '').indexOf("'" + role + "'") !== -1) t.classList.add('active');
  });
  renderUsers();
}

function filterUsersBySearch(q) {
  usersSearchQuery = (q || '').trim().toLowerCase();
  renderUsers();
}

function sortUsersBy(col) {
  if (usersSortBy === col) {
    usersSortDir = usersSortDir === 1 ? -1 : 1;
  } else {
    usersSortBy = col;
    usersSortDir = 1;
  }
  renderUsers();
}

// ── RENDER USERS ──
function renderUsers() {
  var list = usersRoleFilter === 'all' ? users : users.filter(function (u) { return u.role === usersRoleFilter; });
  if (usersSearchQuery) {
    list = list.filter(function (u) { return u.name.toLowerCase().indexOf(usersSearchQuery) !== -1; });
  }
  // Default order: newest users first by ID, unless user picked a sort
  list = list.slice().sort(function (a, b) {
    if (!usersSortBy) {
      return (b.id || 0) - (a.id || 0);
    }
    var cmp = 0;
    if (usersSortBy === 'id') {
      cmp = (a.id || 0) - (b.id || 0);
    } else if (usersSortBy === 'name') {
      cmp = (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    } else if (usersSortBy === 'email') {
      cmp = (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase());
    }
    return cmp * usersSortDir;
  });

  // PAGINATION
  const itemsPerPage = 10;
  const totalPages = Math.ceil(list.length / itemsPerPage) || 1;
  if (currentUsersPage > totalPages) currentUsersPage = totalPages;
  const startIndex = (currentUsersPage - 1) * itemsPerPage;
  const paginatedList = list.slice(startIndex, startIndex + itemsPerPage);

  var arrow = function (col) {
    if (usersSortBy !== col) return '';
    return ' <span class="th-arrow">' + (usersSortDir === 1 ? '↑' : '↓') + '</span>';
  };

  var idHeader = '<span class="th-sortable" onclick="sortUsersBy(\'id\')" title="Sort by ID">ID' + arrow('id') + '</span>';
  var userHeader = '<span class="th-sortable" onclick="sortUsersBy(\'name\')" title="Sort by name">User' + arrow('name') + '</span>';

    var h = '<div class="table-header" style="grid-template-columns: 70px 1.5fr 1fr 1fr 100px 100px 100px;">'
    + idHeader
    + userHeader
    + '<span>Role</span>'
    + '<span>Module</span>'
    + '<span>Status</span>'
    + '<span>Created</span>'
    + '<span>Actions</span>'
    + '</div>';

  if (paginatedList.length === 0) {
      h += '<div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 13px;">No users found.</div>';
  } else {
    paginatedList.forEach(function (u, i) {
      var statusClass = 'badge-active';
      var statusText = u.status || 'active';
      var displayStatus = statusText;
      if (statusText === 'inactive') statusClass = 'badge-inactive';
      if (statusText === 'pending') statusClass = 'badge-pending';
      if (statusText === 'suspended') {
          statusClass = 'badge-inactive';
          displayStatus = 'Inactive';
      }

      var created = u.created_at ? u.created_at.substring(0, 10) : '—';

      h += '<div class="table-row anim d' + (i % 5 + 1) + '" onclick="openUserProfile(' + u.id + ')" style="grid-template-columns: 70px 1.5fr 1fr 1fr 100px 100px 100px;">'
        + '<div style="color:var(--text-dim);font-size:12px;font-family:monospace">ID-' + u.id.toString().padStart(3, '0') + '</div>'
        + '<div class="tr-user">'
        + '<div class="tr-avatar" style="background:' + u.color + ';color:#1a1a1a">' + (u.avatar_url ? '<img src="' + u.avatar_url + '" alt="Avatar"/>' : u.initials) + '</div>'
        + '<div><div class="tr-name">' + u.name + '</div><div class="tr-email">' + u.email + '</div></div>'
        + '</div>'
        + '<div class="tr-role">' + u.role + '</div>'
        + '<div style="font-size:11px;color:var(--text-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (u.module_name || 'User Management') + '</div>'
        + '<div><span class="badge ' + statusClass + '">' + displayStatus.toLowerCase() + '</span></div>'
        + '<div style="color:var(--text-mid);font-size:12px">' + created + '</div>'
        + '<div class="tr-actions">'
        + '<button class="icon-btn" title="View" onclick="event.stopPropagation();openUserProfile(' + u.id + ')">👁</button>'
        + '<button class="icon-btn" title="More" onclick="event.stopPropagation();openCtxMenu(event,' + u.id + ')">⋯</button>'
        + '</div></div>';
    });
  }
  document.getElementById('usersTable').innerHTML = h;
  renderUsersPagination(totalPages);
}

function renderUsersPagination(totalPages) {
  var container = document.getElementById('usersPagination');
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  var h = '<button class="page-btn" ' + (currentUsersPage === 1 ? 'disabled' : '') + ' onclick="changeUsersPage(' + (currentUsersPage - 1) + ')">←</button>';
  for (var i = 1; i <= totalPages; i++) {
    h += '<button class="page-btn ' + (i === currentUsersPage ? 'active' : '') + '" onclick="changeUsersPage(' + i + ')">' + i + '</button>';
  }
  h += '<button class="page-btn" ' + (currentUsersPage === totalPages ? 'disabled' : '') + ' onclick="changeUsersPage(' + (currentUsersPage + 1) + ')">→</button>';
  container.innerHTML = h;
}

function changeUsersPage(page) {
    currentUsersPage = page;
    renderUsers();
}


// ── USER PROFILE PANEL ──
function openUserProfile(id) {
  var u = users.find(function (x) { return x.id === id; });
  if (!u) return;
  var overlay = document.getElementById('profileOverlay');
  var content = document.getElementById('profileContent');
  if (!overlay || !content) return;

  var sessionEmail = '';
  try {
    sessionEmail = (sessionStorage.getItem('ums-user') || '').trim().toLowerCase();
  } catch (e) { }

  var uEmail = (u.email || '').trim().toLowerCase();
  var isMe = (uEmail === sessionEmail && sessionEmail !== '');

  var modalLabel = document.querySelector('.profile-header-label');
  if (modalLabel) {
    modalLabel.textContent = isMe ? 'My Profile' : 'User Profile';
  }

  var typeLabel = u.role === 'Student' ? 'Student' : 'Faculty / Staff';
  content.innerHTML =
    '<div class="profile-main">'
    + '<div class="profile-avatar" style="background:' + u.color + ';color:#1a1a1a">' + (u.avatar_url ? '<img src="' + u.avatar_url + '" alt="Avatar"/>' : u.initials) + '</div>'
    + '<div class="profile-primary">'
    + '<div class="profile-name">' + u.name + '</div>'
    + '<div class="profile-role">' + u.role + '</div>'
    + '<div class="profile-status-row">'
    + '<span class="profile-type-tag">' + typeLabel + '</span>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '<div class="profile-section">'
    + '<div class="profile-section-title">Contact</div>'
    + '<div class="profile-meta-row"><span class="profile-meta-label">Email</span><span class="profile-meta-value">' + u.email + '</span></div>'
    + '<div class="profile-meta-row"><span class="profile-meta-label">User ID</span><span class="profile-meta-value">ID-' + u.id.toString().padStart(3, '0') + '</span></div>'
    + '</div>'
    + '<div class="profile-section">'
    + '<div class="profile-section-title">Account</div>'
    + '<div class="profile-meta-row"><span class="profile-meta-label">Role</span><span class="profile-meta-value">' + u.role + '</span></div>'
    + '<div class="profile-meta-row"><span class="profile-meta-label">Created</span><span class="profile-meta-value">' + (u.created_at ? u.created_at.substring(0, 10) : '—') + '</span></div>'
    + '<div class="profile-meta-row"><span class="profile-meta-label">Last Login</span><span class="profile-meta-value">' + (u.last_login_at ? u.last_login_at.replace('T', ' ').substring(0, 16) : 'Never') + '</span></div>'
    + '</div>';
  overlay.classList.add('show');
}
function closeUserProfile() {
  var overlay = document.getElementById('profileOverlay');
  if (overlay) overlay.classList.remove('show');
}

function openAdminProfile() {
  // Use the logged-in user's email from session first
  var sessionEmail = '';
  try {
    sessionEmail = (sessionStorage.getItem('ums-user') || '').trim().toLowerCase();
  } catch (e) { }

  if (!sessionEmail) {
    showToast('Please sign in to view your profile');
    return;
  }

  var loggedIn = users.find(function (u) {
    return (u.email || '').toLowerCase() === sessionEmail;
  });

  if (loggedIn) {
    openUserProfile(loggedIn.id);
  } else {
    // If we can't find the specific user, show the first Administrator
    var admin = users.find(function (u) { return u.role === 'Administrator'; });
    if (admin) {
      openUserProfile(admin.id);
    } else {
      showToast('Could not find your user profile');
    }
  }
}

document.getElementById('profileAvatarInput').addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (!file) return;

  var u = users.find(function (x) {
    var idElems = document.querySelectorAll('.profile-meta-value');
    var idStr = '';
    idElems.forEach(function (el) {
      if (el.textContent.indexOf('ID-') === 0) {
        idStr = el.textContent;
      }
    });
    var numId = parseInt(idStr.replace('ID-', ''), 10);
    return x.id === numId;
  });

  if (!u) return;

  var formData = new FormData();
  formData.append('avatar', file);
  formData.append('user_id', u.id);

  fetch('backend/upload_avatar.php', {
    method: 'POST',
    body: formData
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to upload avatar');
      return res.json();
    })
    .then(function (data) {
      if (data.avatar_url) {
        u.avatar_url = data.avatar_url + '?t=' + new Date().getTime(); // Anti-cache
        showToast('Avatar updated successfully');
        openUserProfile(u.id); // Reload modal
        renderUsers();
        renderDashboardUserList();
      }
    })
    .catch(function (err) {
      console.error(err);
      showToast('Error uploading avatar');
    });
});

// ── RENDER ROLES ──
function loadRolesData() {
  return fetch('backend/roles_api.php?action=list_roles')
    .then(res => res.json())
    .then(data => {
      apiRoles = data;
      renderRoles();
      if (!selectedRoleId && apiRoles.length > 0) {
        selectRole(apiRoles[0].id);
      }
    });
}

function loadPermissionsData() {
  return fetch('backend/roles_api.php?action=list_permissions')
    .then(res => res.json())
    .then(data => {
      apiPermissions = data;
    });
}

function renderRoles() {
  const container = document.getElementById('rolesList');
  if (!container) return;

  container.innerHTML = apiRoles.map(r => {
    const ico = roleIcons[r.name] || roleIcons['Staff'];
    const color = roleColors[r.name] || '#666';
    const activeClass = selectedRoleId == r.id ? 'active' : '';

    return `
      <div class="role-item-card anim ${activeClass}" onclick="selectRole(${r.id})">
        <div class="rc-top">
          <div class="rc-ico" style="background: ${color}22; color: ${color}">
            ${ico}
          </div>
          <span class="rc-count">${r.user_count} users</span>
        </div>
        <div class="rc-title">${r.name}</div>
        <div class="rc-desc">${r.description || ''}</div>
        <div class="rc-perms-count">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ${r.perm_count} permissions assigned
        </div>
      </div>
    `;
  }).join('');
}

function selectRole(roleId) {
  selectedRoleId = roleId;
  renderRoles(); // Update active state in sidebar

  const role = apiRoles.find(r => r.id === roleId);
  if (!role) return;

  // Render Header
  const header = document.getElementById('roleDetailHeader');
  const ico = roleIcons[role.name] || roleIcons['Staff'];
  const color = roleColors[role.name] || '#666';

  header.innerHTML = `
    <div class="rdh-left">
      <div class="rdh-ico" style="background: ${color}22; color: ${color}">
        ${ico}
      </div>
      <div class="rdh-info">
        <div class="rdh-title">${role.name}</div>
        <div class="rdh-desc">${role.description || ''}</div>
        <div class="rdh-meta">
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="8" r="4"/></svg> ${role.user_count} users assigned</span>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> ${role.perm_count} permissions</span>
        </div>
      </div>
    </div>
    <div class="rdh-actions">
      <button class="icon-btn" title="Edit Role" style="width:36px;height:36px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn" title="Delete Role" style="width:36px;height:36px;color:var(--red)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  `;

  // Fetch role permissions and then render grid
  fetch('backend/roles_api.php?action=get_role_permissions&role_id=' + roleId)
    .then(res => res.json())
    .then(perms => {
      selectedRolePermissions = perms;
      renderPermissionsUI();
    });
}

function renderPermissionsUI() {
  const container = document.getElementById('permissionsGroups');
  if (!container) return;

  if (apiPermissions.length === 0) {
    container.innerHTML = '<div class="loading-state">Loading permissions...</div>';
    return;
  }

  // Group permissions by prefix/category (optional, lets just list them for now)
  // For better UX, we can group them by "User Management", "Role Management", etc.
  // Group permissions dynamically by prefix (e.g. "Users", "Grades")
  const groups = {};
  apiPermissions.forEach(p => {
    const parts = p.name.split(':');
    const cat = parts.length > 1 ? parts[0] : 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  let html = '';
  for (const [cat, perms] of Object.entries(groups)) {
    if (perms.length === 0) continue;
    html += `
      <div class="perm-category">
        <div class="perm-cat-title">${cat}</div>
        <div class="perm-group-grid">
          ${perms.map(p => {
      const checked = selectedRolePermissions.includes(p.id.toString()) || selectedRolePermissions.includes(parseInt(p.id)) ? 'checked' : '';
      return `
              <div class="perm-checkbox-item ${checked}" onclick="togglePermission(${p.id})">
                <div class="pci-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div class="pci-info">
                  <div class="pci-title">${p.name} ${checked ? '<span class="pci-status-ico">✓</span>' : ''}</div>
                  <div class="pci-desc">${p.description || ''}</div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function togglePermission(permId) {
  const index = selectedRolePermissions.indexOf(permId.toString());
  const indexInt = selectedRolePermissions.indexOf(parseInt(permId));

  if (index !== -1) {
    selectedRolePermissions.splice(index, 1);
  } else if (indexInt !== -1) {
    selectedRolePermissions.splice(indexInt, 1);
  } else {
    selectedRolePermissions.push(permId);
  }

  renderPermissionsUI(); // Optimistic UI update

  // Save to backend
  fetch('backend/roles_api.php?action=update_role_permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role_id: selectedRoleId,
      permission_ids: selectedRolePermissions,
      user_id: sessionStorage.getItem('ums-user-id')
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Reload role stats in sidebar
        loadRolesData();
        showToast('Permissions updated');
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Error saving permissions');
    });
}

function loadAuthSettings() {
  return fetch('backend/auth_settings.php')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      authSettings.forEach(function (s) {
        if (data[s.key] !== undefined) {
          s.on = data[s.key] === '1';
        }
        if (s.key === 'account_lockout') {
          if (data['max_attempts'])    s.inputVal   = data['max_attempts'];
          if (data['lockout_duration']) s.durationVal = data['lockout_duration'];
        }
      });
      if (data['reset_link_expiry'])          recoveryData.settings.link_expiry  = data['reset_link_expiry'];
      if (data['reset_max_otp_attempts'])     recoveryData.settings.max_otp      = data['reset_max_otp_attempts'];
      if (data['reset_backup_email_required'] !== undefined)
        recoveryData.settings.backup_email = data['reset_backup_email_required'] === '1';

      renderAuth();
      if (document.getElementById('page-recovery').classList.contains('show')) {
        renderRecovery();
      }
    });
}

function saveAuthSetting(key, value) {
  return fetch('backend/auth_settings.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: key, value: value })
  });
}

function toggleAuthSetting(index) {
  var s = authSettings[index];
  s.on = !s.on;
  saveAuthSetting(s.key, s.on ? '1' : '0')
    .then(function () { renderAuthTab(); });
}

function updateMaxAttempts(index, val) {
  authSettings[index].inputVal = val;
  saveAuthSetting('max_attempts', val);
}

function updateLockoutDuration(index, val) {
  authSettings[index].durationVal = val;
  saveAuthSetting('lockout_duration', val);
}

// ── RENDER AUTH ──
let activeAuthTab = 'overview';
let activeSessions = [];


function switchAuthTab(tab) {
  activeAuthTab = tab;
  document.querySelectorAll('.auth-tab').forEach(function (b) { b.classList.remove('active'); });
  var btn = document.getElementById('auth-tab-' + tab);
  if (btn) btn.classList.add('active');
  renderAuthTab();
}

function renderAuth() {
  activeAuthTab = 'overview';
  document.querySelectorAll('.auth-tab').forEach(function (b) {
    b.classList.remove('active');
  });
  var firstBtn = document.getElementById('auth-tab-overview');
  if (firstBtn) firstBtn.classList.add('active');
  renderAuthTab();
}

function renderAuthTab() {
  var el = document.getElementById('authTabContent');
  if (!el) return;
  if (activeAuthTab === 'overview')  renderAuthOverview(el);
  if (activeAuthTab === 'policies')  renderAuthPolicies(el);
  if (activeAuthTab === 'threats')   renderAuthThreats(el);
}

// ── TAB: Security Overview ──
function renderAuthOverview(el) {
  var totalUsers    = users.length;
  var activeUsers   = users.filter(function (u) { return u.status === 'active'; }).length;
  var suspended     = users.filter(function (u) { return u.status === 'suspended'; }).length;
  var sessionCount  = activeSessions.length;
  var failedToday   = logs.filter(function (l) {
    var d = l.time ? l.time.substring(0, 10) : '';
    var today = new Date().toISOString().substring(0, 10);
    return d === today && l.status === 'failed';
  }).length;
  var tfa = authSettings.find(function (s) { return s.key === 'two_factor_auth'; });
  var tfaOn = tfa ? tfa.on : false;

  var stats = [
    { label: 'Active Users',       val: activeUsers,  ico: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="8" r="4"/></svg>', bg: 'rgba(34,197,94,.15)', clr: '#4ade80' },
    { label: 'Failed Logins Today',val: failedToday,  ico: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', bg: 'var(--red-dim)', clr: 'var(--red)' },
    { label: 'Locked Accounts',    val: suspended,    ico: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', bg: 'var(--amber-dim)', clr: 'var(--amber)' },
  ];

  var h = '<div class="auth-overview-grid">';
  stats.forEach(function (s) {
    h += '<div class="auth-stat-card">'
      + '<div class="auth-stat-ico" style="background:' + s.bg + '">' + s.ico + '</div>'
      + '<div class="auth-stat-info">'
      + '<div class="auth-stat-val" style="color:' + s.clr + '">' + s.val + '</div>'
      + '<div class="auth-stat-label">' + s.label + '</div>'
      + '</div></div>';
  });
  h += '</div>';

  // Security status checklist
  var lockoutSetting = authSettings.find(function (s) { return s.key === 'account_lockout'; });
  var monitorSetting = authSettings.find(function (s) { return s.key === 'login_monitoring'; });
  var policies = [
    { label: 'Two-Factor Authentication', on: tfaOn },
    { label: 'Account Lockout Policy',    on: lockoutSetting ? lockoutSetting.on : false },
    { label: 'Login Monitoring',          on: monitorSetting ? monitorSetting.on : false },
    { label: 'Password Policy Enforced',  on: true },
  ];

  h += '<div class="auth-overview-panel">'
    + '<div class="aop-title">Security Status</div>';
  policies.forEach(function (p) {
    var color = p.on ? '#4ade80' : 'var(--red)';
    var ico = p.on
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    h += '<div class="aop-row"><div style="display:flex;align-items:center;gap:8px">' + ico + '<span style="font-size:13px;color:var(--text-main)">' + p.label + '</span></div><span style="font-size:11px;font-weight:700;color:' + color + '">' + (p.on ? 'ENABLED' : 'DISABLED') + '</span></div>';
  });
  h += '</div>';

  var recentLogins = logs.filter(function(l) { return (l.type || '').toLowerCase() === 'login' && l.status === 'success'; }).slice(0, 5);
  h += '<div class="auth-overview-panel" style="margin-top:20px">'
    + '<div class="aop-title" style="margin-bottom:12px;">Active Devices & Recent Logins</div>';
  
  if (recentLogins.length === 0) {
    h += '<div style="font-size:13px;color:var(--text-dim);text-align:center;padding:10px;">No recent logins found.</div>';
  } else {
    h += '<div style="display:flex;flex-direction:column;gap:10px;">';
    recentLogins.forEach(function(rl) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:10px;">'
         + '<div style="display:flex;flex-direction:column;gap:3px;"><div style="font-size:13px;color:var(--text-main);font-weight:500;">' + (rl.user || 'Unknown User') + '</div>'
         + '<div style="font-size:10px;color:var(--text-dim);">' + formatRegularTime(rl.time) + '</div></div>'
         + '<div style="font-size:11px;font-family:monospace;color:var(--accent);background:rgba(0, 229, 160, 0.1);padding:3px 8px;border-radius:4px;">IP: ' + (rl.ip || 'Unknown') + '</div>'
         + '</div>';
    });
    h += '</div>';
  }
  h += '</div>';

  el.innerHTML = h;
}

// ── TAB: Security Policies ──
function renderAuthPolicies(el) {
  var h = '<div class="settings-grid">';
  authSettings.forEach(function (s, i) {
    var extra = '';
    if (s.showInput) {
      extra += '<div class="sc-row"><span class="sc-row-label">' + s.inputLabel + '</span><input class="input-sm" type="text" value="' + (s.inputVal || '') + '" onchange="updateMaxAttempts(' + i + ', this.value)"/></div>';
    }
    if (s.showDuration) {
      extra += '<div class="sc-row"><span class="sc-row-label">Duration (min)</span><input class="input-sm" type="text" value="' + (s.durationVal || '') + '" onchange="updateLockoutDuration(' + i + ', this.value)"/></div>';
    }
    h += '<div class="setting-card anim d' + (i % 5 + 1) + '">'
      + '<div class="sc-header"><div class="sc-title-wrap"><div class="sc-ico" style="background:' + s.color + '">' + s.ico + '</div>'
      + '<span class="sc-title">' + s.title + '</span></div>'
      + '<div class="toggle ' + (s.on ? 'on' : '') + '" onclick="toggleAuthSetting(' + i + ')"><div class="knob"></div></div></div>'
      + '<div class="sc-body">' + s.body + extra + '</div></div>';
  });
  h += '</div>';
  el.innerHTML = h;
}



// ── TAB: Security Threats ──
function renderAuthThreats(el) {
  var threats = logs.filter(function (l) {
    return l.status === 'failed' || l.status === 'warning';
  }).slice(0, 30);

  var h = '<div class="auth-threats-panel">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    + '<div><div style="font-size:15px;font-weight:700;color:var(--text-main)">Security Threats</div>'
    + '<div style="font-size:12px;color:var(--text-dim);margin-top:2px">Recent failed logins and suspicious activity</div></div>'
    + '<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.2)">' + threats.length + ' Threat' + (threats.length !== 1 ? 's' : '') + '</span>'
    + '</div>';

  if (threats.length === 0) {
    h += '<div style="padding:40px;text-align:center;color:var(--text-dim);font-size:13px">✓ No security threats detected</div>';
  } else {
    threats.forEach(function (l) {
      var isWarning = l.status === 'warning';
      var bg    = isWarning ? 'rgba(245,158,11,.06)' : 'rgba(239,68,68,.06)';
      var border = isWarning ? 'rgba(245,158,11,.2)' : 'rgba(239,68,68,.2)';
      var tag   = isWarning ? 'WARNING' : 'FAILED';
      var tagC  = isWarning ? '#fbbf24' : '#f87171';
      h += '<div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid ' + border + ';border-radius:10px;background:' + bg + ';margin-bottom:10px">'
        + '<div style="flex-shrink:0;padding-top:1px">'
        + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + tagC + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        + '</div><div style="flex:1;min-width:0">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">'
        + '<span style="font-size:10px;font-weight:800;letter-spacing:.6px;color:' + tagC + '">' + tag + '</span>'
        + '<span style="font-size:11px;color:var(--text-dim)">' + formatRegularTime(l.time) + '</span>'
        + '</div>'
        + '<div style="font-size:13px;font-weight:600;color:var(--text-main);margin-bottom:2px">' + (l.action || '—') + '</div>'
        + '<div style="font-size:11px;color:var(--text-dim)">User: <span style="color:var(--accent)">' + (l.user || 'Unknown') + '</span> · IP: <span style="font-family:monospace">' + (l.ip || '—') + '</span></div>'
        + '</div></div>';
    });
  }
  h += '</div>';
  el.innerHTML = h;
}

function renderLogs() {
  var list = logs;

  var thStyle = 'padding:11px 14px;font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:.6px;text-align:left;white-space:nowrap;background:rgba(255,255,255,.04);border-top:1px solid rgba(255,255,255,.08);border-bottom:2px solid rgba(255,255,255,.12)';
  var h = '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr style="background:rgba(255,255,255,.04)">'
    + '<th style="' + thStyle + '">Timestamp</th>'
    + '<th style="' + thStyle + '">User</th>'
    + '<th style="' + thStyle + '">Action</th>'
    + '<th style="' + thStyle + '">Module</th>'
    + '<th style="' + thStyle + '">Submodule</th>'
    + '<th style="' + thStyle + '">Status</th>'
    + '<th style="' + thStyle + '">IP Address</th>'
    + '</tr></thead><tbody>';

  if (list.length === 0) {
    h += '<tr><td colspan="7" style="padding:28px;text-align:center;color:var(--text-dim);font-size:12px">No log entries found.</td></tr>';
  } else {
    list.forEach(function (l, i) {
      var ts = formatRegularTime(l.time);
      var statusStyle = '';
      var statusLabel = 'Success';
      if (l.status === 'failed') {
        statusStyle = 'background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.2)';
        statusLabel = 'Failed';
      } else if (l.status === 'warning') {
        statusStyle = 'background:rgba(245,158,11,.12);color:#fbbf24;border:1px solid rgba(245,158,11,.2)';
        statusLabel = 'Warning';
      } else {
        statusStyle = 'background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.2)';
        statusLabel = 'Success';
      }
      var moduleName = l.module_name || '—';
      var rowBg = i % 2 === 0 ? '' : 'background:rgba(255,255,255,.02)';
      var tdStyle = 'padding:11px 14px;font-size:12px;color:var(--text-main);border-bottom:1px solid var(--border);vertical-align:middle';
      h += '<tr class="anim d' + (i % 5 + 1) + '" style="' + rowBg + ';transition:background .15s;cursor:pointer" '
        + 'onclick="openLogModal(' + (l.id || 0) + ')" '
        + 'onmouseover="this.style.background=\'rgba(255,255,255,.04)\'" onmouseout="this.style.background=\'' + (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)') + '\'">'
        + '<td style="' + tdStyle + ';color:var(--text-dim);font-size:11px;white-space:nowrap">'
        + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
        + ts + '</td>'
        + '<td style="' + tdStyle + '">'
        + '<div style="display:flex;align-items:center;gap:6px">'
        + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="8" r="4"/></svg>'
        + '<span style="color:var(--accent);font-weight:500">' + (l.user || '—') + '</span></div></td>'
        + '<td style="' + tdStyle + '">' + (l.action || '—') + '</td>'
        + '<td style="' + tdStyle + ';color:var(--text-dim)">' + moduleName + '</td>'
        + '<td style="' + tdStyle + ';color:var(--text-dim)">' + (l.submodule || '—') + '</td>'
        + '<td style="' + tdStyle + '">'
        + '<div style="display:flex;align-items:center;gap:5px">'
        + '<span style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;' + statusStyle + '">' + statusLabel + '</span>'
        + '</div></td>'
        + '<td style="' + tdStyle + ';color:var(--text-dim);font-size:11px;font-family:monospace">' + (l.ip || '—') + '</td>'
        + '</tr>';
    });
  }
  h += '</tbody></table>';
  document.getElementById('logTable').innerHTML = h;
  renderLogPagination();
}

function renderLogPagination() {
  var container = document.getElementById('logPagination');
  if (!container) return;

  if (logTotalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  var h = '';
  
  // Previous button
  h += '<button class="page-btn" ' + (currentLogPage === 1 ? 'disabled' : '') + ' onclick="changeLogPage(' + (currentLogPage - 1) + ')">←</button>';

  // Page numbers
  var startPage = Math.max(1, currentLogPage - 2);
  var endPage = Math.min(logTotalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  if (startPage > 1) {
    h += '<button class="page-btn" onclick="changeLogPage(1)">1</button>';
    if (startPage > 2) h += '<span class="page-dots">...</span>';
  }

  for (var i = startPage; i <= endPage; i++) {
    h += '<button class="page-btn ' + (i === currentLogPage ? 'active' : '') + '" onclick="changeLogPage(' + i + ')">' + i + '</button>';
  }

  if (endPage < logTotalPages) {
    if (endPage < logTotalPages - 1) h += '<span class="page-dots">...</span>';
    h += '<button class="page-btn" onclick="changeLogPage(' + logTotalPages + ')">' + logTotalPages + '</button>';
  }

  // Next button
  h += '<button class="page-btn" ' + (currentLogPage === logTotalPages ? 'disabled' : '') + ' onclick="changeLogPage(' + (currentLogPage + 1) + ')">→</button>';

  container.innerHTML = h;
}

function changeLogPage(page) {
  if (page < 1 || page > logTotalPages) return;
  loadLogsFromApi(page);
}

function openLogModal(id) {
  var l = logs.find(function (x) { return x.id === id; });
  if (!l) return;

  document.getElementById('logModalId').textContent = 'Log ID: #' + l.id;
  document.getElementById('logModalTime').textContent = formatRegularTime(l.time);
  document.getElementById('logModalUser').textContent = l.user || '(Unknown)';
  document.getElementById('logModalIp').textContent = l.ip || '—';
  document.getElementById('logModalAction').textContent = l.action || '—';
  document.getElementById('logModalResource').textContent = l.resource || '—';
  document.getElementById('logModalFullAction').textContent = l.fullAction || l.action || '—';

  var statusEl = document.getElementById('logModalStatus');
  var statusStyle = '';
  var statusLabel = 'Success';
  var icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

  if (l.status === 'failed') {
    statusStyle = 'color:var(--red)';
    statusLabel = 'Failed';
    icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else if (l.status === 'warning') {
    statusStyle = 'color:var(--amber)';
    statusLabel = 'Warning';
    icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  } else {
    statusStyle = 'color:var(--accent)';
  }

  statusEl.innerHTML = '<span style="display:inline-flex;align-items:center;padding:4px 0;font-size:13px;font-weight:600;' + statusStyle + '">' + icon + statusLabel + '</span>';

  document.getElementById('logModalOverlay').classList.add('show');
}

function closeLogModal() {
  document.getElementById('logModalOverlay').classList.remove('show');
}

// ── RENDER RECOVERY ──
function loadRecoveryData() {
  fetch('backend/recovery_api.php')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.recent) {
        // Transform backend payload into format expected by render
        recoveryData.recent = data.recent.map(r => {
          return {
            name: r.name,
            status: r.status, // "pending", "completed", "expired"
            time: getTimeAgo(r.time) // use existing helper
          };
        });
      }
      renderRecovery();
    })
    .catch(err => {
      console.error("Error loading recovery data:", err);
      // Fallback/Render what we have
      renderRecovery();
    });
}

function updateRecoverySetting(key, val) {
  if (key === 'reset_backup_email_required') {
     recoveryData.settings.backup_email = val === '1';
     renderRecovery();
  } else if (key === 'reset_link_expiry') {
     recoveryData.settings.link_expiry = val;
  } else if (key === 'reset_max_otp_attempts') {
     recoveryData.settings.max_otp = val;
  }
  saveAuthSetting(key, val).then(() => {
    // Optionally show a toaster for backup email required since it acts immediately
    if (key === 'reset_backup_email_required') {
        showToast('Settings updated');
    }
  });
}

function renderRecovery() {
  var proc = recoveryData.process.map(function (p) { return '<li><span class="li-ico">' + p.ico + '</span>' + p.txt + '</li>' }).join('');
  
  var rec = '';
  if (recoveryData.recent && recoveryData.recent.length > 0) {
      rec = recoveryData.recent.map(function (r) {
        var b = r.status === 'completed' ? 'badge-active' : (r.status === 'expired' ? 'badge-expired' : 'badge-pending');
        // If there's no native "badge-expired" class, it will fall back gracefully or we could inline style it.
        return '<div class="mt-row"><div class="mt-left"><span class="mt-name">' + r.name + '</span>'
          + '<span class="badge ' + b + '" style="font-size:9px;padding:2px 6px"><span class="bd"></span>' + r.status + '</span></div>'
          + '<span class="mt-time">' + r.time + '</span></div>';
      }).join('');
  } else {
      rec = '<div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 12px;">No recent reset requests found.</div>';
  }

  var backupEmailOn = recoveryData.settings.backup_email ? 'on' : '';

  document.getElementById('recoveryGrid').innerHTML =
      '<div class="rec-card anim d2"><div class="rec-header"><div class="rec-ico" style="background:var(--blue-dim)"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>'
    + '<div><div class="rec-title">Recent Reset Requests</div><div class="rec-sub">Last 24 hours</div></div></div>'
    + '<div class="rec-body"><div class="mini-table">' + rec + '</div></div></div>'
    + '<div class="rec-card anim d3"><div class="rec-header"><div class="rec-ico" style="background:var(--purple-dim)"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>'
    + '<div><div class="rec-title">Recovery Settings</div><div class="rec-sub">Configure reset policies</div></div></div>'
    + '<div class="rec-body"><div class="sc-row"><span class="sc-row-label">Reset Link Expiry</span><input class="input-sm" type="text" value="' + recoveryData.settings.link_expiry + '" style="width:55px" onchange="updateRecoverySetting(\'reset_link_expiry\', this.value)"/></div>'
    + '<div style="font-size:10px;color:var(--text-dim);margin-top:3px">hours</div>'
    + '<div class="sc-row" style="margin-top:10px"><span class="sc-row-label">Max OTP Attempts</span><input class="input-sm" type="text" value="' + recoveryData.settings.max_otp + '" style="width:55px" onchange="updateRecoverySetting(\'reset_max_otp_attempts\', this.value)"/></div>'
    + '<div style="font-size:10px;color:var(--text-dim);margin-top:3px">attempts before lock</div>'
    + '<div class="sc-row" style="margin-top:10px"><span class="sc-row-label">Backup Email Required</span>'
    + '<div class="toggle ' + backupEmailOn + '" style="width:34px;height:19px" onclick="updateRecoverySetting(\'reset_backup_email_required\', recoveryData.settings.backup_email ? \'0\' : \'1\')"><div class="knob"></div></div></div></div></div>';
}

// ── CSV EXPORT HELPERS ──
function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
function downloadCSV(filename, rows) {
  const csv = rows.map(function (row) {
    return row.map(csvEscape).join(',');
  }).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportUsersCSV() {
  const rows = [];
  rows.push(['ID', 'Name', 'Email', 'Role', 'Module', 'Status']);
  users.forEach(function (u) {
    rows.push([u.id, u.name, u.email, u.role, u.module_name || 'User Management', u.status]);
  });
  downloadCSV('users.csv', rows);
  showToast('Exported ' + users.length + ' users to CSV successfully');
}
function exportLogsCSV() {
  const rows = [];
  rows.push(['Timestamp', 'User', 'Action', 'Module', 'Submodule', 'Status', 'IP Address']);
  logs.forEach(function (l) {
    rows.push([l.time, l.user, l.action, l.module_name || l.resource || '—', l.submodule || '—', l.status, l.ip]);
  });
  downloadCSV('logs.csv', rows);
  showToast('Exported ' + logs.length + ' log entries to CSV');
}

// ── FILTERS ──
function filterUsersByRole(role, el) {
  usersRoleFilter = role;
  document.querySelectorAll('#page-accounts .tabs .tab').forEach(function (t) { t.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderUsers();
}
function filterUsers(type, el) {
  filterUsersByRole(type || 'all', el);
}
function filterLog(type, el) {
  document.querySelectorAll('.log-filter').forEach(function (f) { f.classList.remove('active') });
  el.classList.add('active');
  currentLogPage = 1;
  loadLogsFromApi(1, type);
}

// ── USER HELPERS ──
const ROLE_NAME_TO_ID = {
  'Administrator': 1,
  'Registrar': 2,
  'Faculty': 3,
  'Staff': 4,
  'Student': 5,
  'Clinic Staff': 6
};

function loadUsersFromApi() {
  var t = new Date().getTime();
  return fetch('backend/users.php?t=' + t)
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) data = [];
      users = data.map(function (row) {
        var name = row.full_name || '';
        var role = row.role_name || 'Student';
        return {
          id: row.id,
          name: name,
          email: row.email,
          role: role,
          status: row.status || 'active',
          avatar_url: row.avatar_url || null,
          last_login_at: row.last_login_at || null,
          created_at: row.created_at || null,
          module_id: row.module_id || 10,
          module_name: row.module_name || 'User Management',
          color: getDefaultUserColor(),
          initials: getInitialsFromName(name)
        };
      }); renderDashboard();
      renderUsers();
      updateTopbarAvatar();
    })
    .catch(function (err) {
      console.error(err);
      renderDashboard();
      renderUsers();
    });
}

function updateTopbarAvatar() {
  var sessionEmail = '';
  try { sessionEmail = sessionStorage.getItem('ums-user') || ''; } catch (e) { }
  if (!sessionEmail) return;

  var loggedIn = users.find(function (u) { return u.email === sessionEmail; });
  var avatarEl = document.getElementById('topbarAvatar');
  if (loggedIn && avatarEl) {
    avatarEl.style.background = loggedIn.color;
    avatarEl.innerHTML = loggedIn.avatar_url
      ? '<img src="' + loggedIn.avatar_url + '" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;"/>'
      : loggedIn.initials;
  }
}

function loadLogsFromApi(page, filter, module_id) {
  currentLogPage = page || currentLogPage;
  currentLogFilter = filter || currentLogFilter;
  currentLogModuleFilter = module_id || currentLogModuleFilter;

  var t = new Date().getTime();
  var url = 'backend/logs.php?t=' + t 
    + '&page=' + currentLogPage 
    + '&limit=10' 
    + '&type=' + currentLogFilter
    + '&module_id=' + currentLogModuleFilter
    + '&search=' + encodeURIComponent(logsSearchQuery);
  
  return fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load logs');
      return res.json();
    })
    .then(function (resData) {
      var data = resData.logs || [];
      logTotalPages = resData.last_page || 1;
      currentLogPage = resData.page || 1;

      if (!Array.isArray(data)) data = [];
      logs = data.map(function (row) {
        var t = (row.event_type || '').toLowerCase();
        var cls = 'lt-update';
        if (t === 'login') cls = 'lt-login';
        else if (t === 'create') cls = 'lt-create';
        else if (t === 'delete') cls = 'lt-delete';
        else if (t === 'password') cls = 'lt-password';
        var actionRaw = (row.action || '').toLowerCase();
        var status = 'success';
        if (actionRaw.indexOf('3x') !== -1 || actionRaw.match(/\(\d+x\)/)) status = 'warning';
        else if (actionRaw.indexOf('failed') !== -1 || actionRaw.indexOf('denied') !== -1 || actionRaw.indexOf('locked') !== -1) status = 'failed';
        else if (actionRaw.indexOf('warning') !== -1 || actionRaw.indexOf('suspended') !== -1) status = 'warning';

        // Short action label
        var actionLabel = row.action || '';
        var alow = (row.action || '').toLowerCase();

        if (t === 'create') {
          if (alow.indexOf('role') !== -1) actionLabel = 'Role Created';
          else if (alow.indexOf('permission') !== -1) actionLabel = 'Permission Created';
          else actionLabel = 'User Created';
        } else if (t === 'update') {
          if (alow.indexOf('role') !== -1 || alow.indexOf('permission') !== -1) {
            actionLabel = 'Role Permissions Updated';
          } else if (alow.indexOf('password') !== -1 || alow.indexOf('reset') !== -1) {
            actionLabel = 'Password Reset Requested';
          } else {
            actionLabel = 'User Updated';
          }
        } else if (t === 'delete') {
          if (alow.indexOf('role') !== -1) actionLabel = 'Role Deleted';
          else if (alow.indexOf('permission') !== -1) actionLabel = 'Permission Deleted';
          else actionLabel = 'User Deleted';
        } else if (t === 'password') {
          if (alow.indexOf('requested') !== -1) actionLabel = 'Password Reset Requested';
          else actionLabel = 'Password Reset';
        } else if (t === 'login') {
          if (actionRaw.indexOf('3x') !== -1 || actionRaw.indexOf('multiple') !== -1 || actionRaw.match(/\(\d+x\)/)) actionLabel = 'Multiple Attempts';
          else if (actionRaw.indexOf('suspended') !== -1 || actionRaw.indexOf('locked') !== -1) actionLabel = 'Account Suspended';
          else if (status === 'failed') actionLabel = 'Login Failed';
          else if (status === 'warning') actionLabel = 'Login Warning';
          else actionLabel = 'Login Success';
        }

        return {
          id: row.id,
          time: row.created_at || '',
          action: actionLabel,
          fullAction: row.action || '',
          type: row.event_type || '',
          typeClass: cls,
          user: row.user_email || '',
          module_id: row.module_id || null,
          module_name: row.module_name || '',
          submodule_id: row.submodule_id || null,
          submodule: row.submodule_name || '',
          resource: row.resource || '',
          ip: row.ip_address || '',
          status: status
        };
      });
      renderLogs(filter, page);
      var dashboardPanel = document.getElementById('page-dashboard');
      if (dashboardPanel && dashboardPanel.classList.contains('show')) {
        renderDashboard();
      }
    })
    .catch(function (err) {
      console.error(err);
      renderLogs();
    });
}

function getNextUserId() {
  var max = 0;
  users.forEach(function (u) {
    if (u.id > max) max = u.id;
  });
  return max + 1;
}
function getInitialsFromName(name) {
  if (!name) return 'NA';
  var parts = name.trim().split(/\s+/);
  var first = parts[0] && parts[0][0] ? parts[0][0] : '';
  var second = parts[1] && parts[1][0] ? parts[1][0] : '';
  var initials = (first + second).toUpperCase();
  return initials || 'NA';
}
function getDefaultUserColor() {
  return 'linear-gradient(135deg,#4a4a4a,#b0b2c0)';
}
function getTimeAgo(dateStr) {
  if (!dateStr) return '—';
  // Normalize: replace space separator, then append 'Z' if no timezone info
  var normalized = dateStr.replace(' ', 'T');
  if (!/[Z+\-]\d*$/.test(normalized) && !normalized.endsWith('Z')) {
    normalized += 'Z'; // Treat as UTC — Supabase stores in UTC without suffix
  }
  var past = new Date(normalized);
  var now = new Date();
  var diff = Math.floor((now - past) / 1000);
  if (isNaN(diff) || diff < 0) return '—';
  if (diff < 60) return diff + ' second' + (diff !== 1 ? 's' : '') + ' ago';
  var mins = Math.floor(diff / 60);
  if (mins < 60) return mins + ' minute' + (mins !== 1 ? 's' : '') + ' ago';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' hour' + (hrs !== 1 ? 's' : '') + ' ago';
  var days = Math.floor(hrs / 24);
  return days + ' day' + (days !== 1 ? 's' : '') + ' ago';
}

function formatRegularTime(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dateStr;

  var year = d.getFullYear();
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');

  var hours = d.getHours();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  var minutes = String(d.getMinutes()).padStart(2, '0');
  var seconds = String(d.getSeconds()).padStart(2, '0');

  return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + ' ' + ampm;
}

// ── USER MODAL ──
function openUserModal(id) {
  var u = users.find(function (x) { return x.id === id; });
  var title = 'Create New User', btnLabel = 'Create User';

  // Reset fields
  document.getElementById('umName').value = '';
  document.getElementById('umEmail').value = '';
  if (document.getElementById('umPassword')) {
    document.getElementById('umPassword').value = '';
    document.getElementById('umPassword').placeholder = 'Auto-generated on save';
  }

  // Optional/Legacy fields (ensure they exist before assigning)
  if (document.getElementById('umId')) document.getElementById('umId').value = '';
  if (document.getElementById('umIdDisplay')) document.getElementById('umIdDisplay').value = '';
  if (document.getElementById('umDepartment')) document.getElementById('umDepartment').value = 'Computer Science';
  if (document.getElementById('umProgram')) document.getElementById('umProgram').value = "Bachelor's";

  if (document.getElementById('umRole')) {
    document.getElementById('umRole').value = '5'; // Default: Student
  }
  if (document.getElementById('umModule')) {
    document.getElementById('umModule').value = '10'; // Default: User Management
  }

  if (u) {
    title = 'Edit User';
    btnLabel = 'Save Changes';
    document.getElementById('umName').value = u.name;
    document.getElementById('umEmail').value = u.email;
    if (document.getElementById('umRole')) {
      document.getElementById('umRole').value = u.role;
    }
    if (document.getElementById('umId')) {
      document.getElementById('umId').value = u.id;
    }
    if (document.getElementById('umIdDisplay')) {
      document.getElementById('umIdDisplay').value = u.student_employee_id || '';
    }
    if (document.getElementById('umDepartment') && u.department) {
      document.getElementById('umDepartment').value = u.department;
    }
    if (document.getElementById('umProgram') && u.program) {
      document.getElementById('umProgram').value = u.program;
    }
    if (document.getElementById('umModule')) {
      document.getElementById('umModule').value = u.module_id || '10';
    }
    if (document.getElementById('umRole')) {
      // Find role ID from name if needed, but row.role_id should be available
      document.getElementById('umRole').value = u.role_id || ROLE_NAME_TO_ID[u.role] || '5';
    }
    // Set avatar preview
    var preview = document.getElementById('umAvatarPreview');
    if (preview) {
      preview.style.background = u.color || getDefaultUserColor();
      preview.innerHTML = u.avatar_url
        ? '<img src="' + u.avatar_url + '" alt="Avatar"/>'
        : u.initials || getInitialsFromName(u.name);
    }
  } else {
    // Default avatar for new user
    var preview = document.getElementById('umAvatarPreview');
    if (preview) {
      preview.style.background = getDefaultUserColor();
      preview.innerHTML = 'AD';
    }
  }

  document.getElementById('userModalTitle').textContent = title;
  document.getElementById('umSaveBtn').textContent = btnLabel;
  document.getElementById('umSaveBtn').dataset.uid = id;
  document.getElementById('userModalOverlay').classList.add('show');
}
function closeUserModal() {
  document.getElementById('userModalOverlay').classList.remove('show');
}
function saveUserModal() {
  var id = parseInt(document.getElementById('umSaveBtn').dataset.uid, 10);
  var nameInput = document.getElementById('umName');
  var emailInput = document.getElementById('umEmail');
  var roleInput = document.getElementById('umRole');
  var deptInput = document.getElementById('umDepartment');
  var progInput = document.getElementById('umProgram');
  var idInput = document.getElementById('umId');
  var passInput = document.getElementById('umPassword');

  var moduleInput = document.getElementById('umModule');

  var name = (nameInput.value || '').trim();
  var email = (emailInput.value || '').trim();
  var roleVal = (roleInput.value || '5').trim();
  var moduleVal = (moduleInput.value || '10').trim();
  var dept = (deptInput && deptInput.value) ? deptInput.value : '';
  var prog = (progInput && progInput.value) ? progInput.value : '';
  var displayIdInput = document.getElementById('umIdDisplay');
  var sid = (displayIdInput && displayIdInput.value) ? displayIdInput.value : '';
  var password = (passInput && passInput.value) ? passInput.value : '';

  if (!name || !email) {
    showToast('Please fill in both Name and Email');
    return;
  }

  if (id === -1 && !password) {
    showToast('Password is required for new users');
    return;
  }

  var actorId = sessionStorage.getItem('ums-user-id');

  closeUserModal();

  if (id === -1) {
    // Create user in backend
    var payload = {
      full_name: name,
      email: email,
      role_id: parseInt(roleVal, 10),
      module_id: parseInt(moduleVal, 10),
      student_employee_id: sid,
      department: dept,
      program: prog,
      password: password,
      status: 'active'
    };
    fetch('backend/users.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Actor-ID': actorId
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
      })
      .then(function (resData) {
        showToast('User "' + name + '" created successfully');

        // If an avatar was selected, upload it now
        var avatarFile = document.getElementById('umAvatarInput').files[0];
        if (avatarFile && resData.id) {
          var formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('user_id', resData.id);
          return fetch('backend/upload_avatar.php', { method: 'POST', body: formData })
            .then(function () { return resData; });
        }
        return resData;
      })
      .then(function () {
        return Promise.all([loadUsersFromApi(), loadLogsFromApi()]).then(function () {
          updateTopbarAvatar();
          var roleName = Object.keys(ROLE_NAME_TO_ID).find(key => ROLE_NAME_TO_ID[key] == roleVal) || 'all';
          goToAccountsByRole(roleName);
        });
      })
      .catch(function (err) {
        console.error(err);
        showToast('Error creating user');
      });
  } else {
    // Save edit to backend
    var payload = {
      full_name: name,
      email: email,
      role_id: parseInt(roleVal, 10),
      module_id: parseInt(moduleVal, 10),
      student_employee_id: sid,
      department: dept,
      program: prog
    };
    if (password) payload.password = password;
    fetch('backend/users.php?id=' + encodeURIComponent(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Actor-ID': actorId
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
      })
      .then(function () {
        showToast('User "' + name + '" updated successfully');
        return Promise.all([loadUsersFromApi(), loadLogsFromApi()]).then(function () {
          updateTopbarAvatar();
        });
      })
      .catch(function (err) {
        console.error(err);
        showToast('Error updating user');
      });
  }
}

document.getElementById('umAvatarInput').addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (!file) return;

  // Local Preview
  var reader = new FileReader();
  reader.onload = function (e) {
    var preview = document.getElementById('umAvatarPreview');
    if (preview) {
      preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview"/>';
    }
  };
  reader.readAsDataURL(file);

  var idRaw = document.getElementById('umSaveBtn').dataset.uid;
  var numId = parseInt(idRaw, 10);
  if (numId === -1 || isNaN(numId)) return; // Don't upload yet for new users

  var u = users.find(function (x) { return x.id === numId; });
  if (!u) return;

  var formData = new FormData();
  formData.append('avatar', file);
  formData.append('user_id', u.id);

  fetch('backend/upload_avatar.php', {
    method: 'POST',
    body: formData
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to upload avatar');
      return res.json();
    })
    .then(function (data) {
      if (data.avatar_url) {
        u.avatar_url = data.avatar_url + '?t=' + new Date().getTime(); // Anti-cache
        showToast('Avatar updated successfully');
        updateTopbarAvatar();
        renderUsers();
        renderDashboardUserList();
      }
    })
    .catch(function (err) {
      console.error(err);
      showToast('Error uploading avatar');
    });
});

// ── ROLE MODAL ──
function openRoleModal() {
  document.getElementById('rmName').value = '';
  document.getElementById('roleModalOverlay').classList.add('show');
}
function closeRoleModal() {
  document.getElementById('roleModalOverlay').classList.remove('show');
}
function saveRoleModal() {
  var name = document.getElementById('rmName').value || 'New Role';
  closeRoleModal();
  showToast('Role "' + name + '" created successfully');
}

// ── CONTEXT MENU ──
function openCtxMenu(e, uid) {
  e.preventDefault();
  e.stopPropagation();
  activeCtxUserId = uid;
  var u = users.find(function (x) { return x.id === uid; });
  var menu = document.getElementById('ctxMenu');
  var x = e.clientX;
  var y = e.clientY + 6;
  if (x + 180 > window.innerWidth) x = window.innerWidth - 190;
  if (y + 160 > window.innerHeight) y = window.innerHeight - 170;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  if (u && u.status === 'inactive') {
    document.getElementById('ctxToggleIco').innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    document.getElementById('ctxToggleLabel').textContent = 'Activate';
  } else {
    document.getElementById('ctxToggleIco').innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-mid)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';
    document.getElementById('ctxToggleLabel').textContent = 'Deactivate';
  }
  menu.classList.add('show');
}
function closeCtxMenu() {
  document.getElementById('ctxMenu').classList.remove('show');
}
function ctxEdit() {
  closeCtxMenu();
  openUserModal(activeCtxUserId);
}
function ctxReset() {
  closeCtxMenu();
  var u = users.find(function (x) { return x.id === activeCtxUserId; });
  if (!u) return;

  var actorId = sessionStorage.getItem('ums-user-id');
  
  fetch('backend/reset_password.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-ID': actorId
    },
    body: JSON.stringify({ user_id: activeCtxUserId })
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Reset failed');
      return res.json();
    })
    .then(function (data) {
      showToast('Password reset email sent to ' + u.email);
      // Optional: Refresh logs or stats if needed
    })
    .catch(function (err) {
      console.error(err);
      showToast('Error sending reset email', true);
    });
}
function ctxToggle() {
  closeCtxMenu();
  var u = users.find(function (x) { return x.id === activeCtxUserId; });
  if (!u) return;
  var newStatus = (u.status === 'inactive') ? 'active' : 'inactive';
  var actorId = sessionStorage.getItem('ums-user-id');
  fetch('backend/users.php?id=' + encodeURIComponent(activeCtxUserId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-ID': actorId
    },
    body: JSON.stringify({ status: newStatus })
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    })
    .then(function () {
      u.status = newStatus;
      showToast('User "' + u.name + '" ' + (newStatus === 'active' ? 'activated' : 'deactivated') + ' successfully');
      return Promise.all([loadUsersFromApi(), loadLogsFromApi()]);
    })
    .catch(function (err) {
      console.error(err);
      showToast('Error updating status');
    });
}
function ctxDelete() {
  closeCtxMenu();
  var u = users.find(function (x) { return x.id === activeCtxUserId; });
  var actorId = sessionStorage.getItem('ums-user-id');
  fetch('backend/users.php?id=' + encodeURIComponent(activeCtxUserId), {
    method: 'DELETE',
    headers: {
      'X-Actor-ID': actorId
    }
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    })
    .then(function () {
      showToast('User "' + ((u && u.name) || 'Unknown') + '" has been deleted');
      return Promise.all([loadUsersFromApi(), loadLogsFromApi()]);
    })
    .catch(function (err) {
      console.error(err);
      showToast('Error deleting user');
    });
}

// Close context menu on outside click
document.addEventListener('click', function (e) {
  if (!e.target.closest('.icon-btn[title="More"]') && !e.target.closest('.ctx-menu')) closeCtxMenu();
});

// ── RESPONSIVE SIDEBAR TOGGLE ──
function toggleSidebar() {
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('sidebarOverlay');
  var btn = document.getElementById('hbBtn');
  if (sb) sb.classList.toggle('open');
  if (ov) ov.classList.toggle('show');
  if (btn) btn.classList.toggle('open');
}

function logout() {
  fetch('backend/logout.php')
    .then(() => {
      try {
        // Preserve Remember Me email across logout
        var rememberEmail = localStorage.getItem('ums-remember-email');
        var rememberTheme = localStorage.getItem('ums-theme');
        localStorage.clear();
        if (rememberEmail) localStorage.setItem('ums-remember-email', rememberEmail);
        if (rememberTheme) localStorage.setItem('ums-theme', rememberTheme);
        sessionStorage.clear();
      } catch (e) { }
      window.location.href = 'login/index.html';
    })
    .catch(() => {
      // Fallback if backend logout fails
      sessionStorage.clear();
      window.location.href = 'login/index.html';
    });
}

initTheme();
// renderRoles(); // Replaced by dynamic loading
renderAuth();
loadRecoveryData();
loadUsersFromApi();
loadLogsFromApi();
loadRolesData();
loadPermissionsData();
loadAuthSettings();

// Periodic log refresh every 30 seconds
setInterval(loadLogsFromApi, 30000);

// PRELOADER GLOBAL EVENT
document.addEventListener('DOMContentLoaded', function() {
  const p = document.getElementById('preloader');
  if (p) {
    setTimeout(() => {
      p.classList.add('fade-out');
      setTimeout(() => { p.style.display = 'none'; }, 300);
    }, 2000);
  }
});
