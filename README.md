# UMS2 — University Management System

A role-based web application for managing university users, sessions, roles, and activity logs. Built on a PHP/Supabase backend with a vanilla HTML/CSS/JS frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, Vanilla JS |
| Backend | PHP 8 (XAMPP / Apache) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + custom session management |
| Mail | Mailpit (local SMTP for dev), PHPMailer |
| Storage | Supabase Storage (avatar uploads) |

---

## Folder Structure

```
ums/
├── index.html              # Main app entry point
├── styles.css              # Global stylesheet
├── script.js               # Main frontend logic
├── composer.json           # PHP dependencies
├── .env                    # Environment variables (not committed)
│
├── assets/
│   ├── images/             # logo.jpg, badge_1.png, badge_2.png
│   └── vendor/             # mailpit.exe / mailpit.zip (not committed)
│
├── backend/                # PHP API endpoints
│   ├── config.php          # App config loader
│   ├── db.php              # DB connection helper
│   ├── auth_helper.php     # Auth utilities
│   ├── auth_settings.php   # Auth settings API
│   ├── login.php           # Login endpoint
│   ├── logout.php          # Logout endpoint
│   ├── logs.php            # Activity log API
│   ├── log_event.php       # Event logging helper
│   ├── users.php           # User management API
│   ├── roles_api.php       # Roles CRUD API
│   ├── sessions_api.php    # Session management API
│   ├── supabase_api.php    # Supabase REST wrapper
│   ├── upload_avatar.php   # Avatar upload handler
│   ├── forgot_password_api.php
│   ├── recovery_api.php
│   ├── reset_password.php
│   ├── reset_password_api.php
│   ├── verify_otp_api.php
│   ├── verify_supabase_api.php
│   ├── get_supabase_config.php
│   ├── config/             # mail.php (PHPMailer config)
│   ├── sql/                # otp_schema.sql
│   └── uploads/avatars/    # Uploaded avatar files
│
├── login/                  # Login module (standalone page)
│   ├── index.html
│   ├── reset.html
│   ├── script.js
│   ├── reset_script.js
│   └── styles.css
│
├── js/
│   └── supabase_init.js    # Supabase JS client init
│
├── database/               # SQL schema & migration files
│   ├── ums.sql
│   ├── ums_pg.sql
│   ├── setup_modules.sql
│   ├── mock_accounts.sql
│   ├── add_admin_user.sql
│   ├── add_module_to_users.sql
│   ├── fix_sessions_trigger.sql
│   └── update_permissions.sql
│
├── scripts/                # Admin/setup utility scripts
│   ├── add_module_column.php
│   ├── apply_sql_db.php
│   ├── insert_admin.php
│   ├── migrate_db.php
│   └── verify_ums_scope.php
│
├── tools/debug/            # One-off diagnostic scripts (not committed)
│   └── (debug_*.php, test_*.php, inspect_*.php, ...)
│
└── vendor/                 # Composer packages (auto-managed)
```

---

## Setup

### Prerequisites
- XAMPP (PHP 8.x + Apache)
- Supabase project with PostgreSQL database
- Node.js (optional, for JS tooling)

### Steps

1. **Clone** the repo into `c:\xampp\htdocs\ums`
2. **Copy** `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   DB_HOST=...
   DB_NAME=...
   DB_USER=...
   DB_PASS=...
   ```
3. **Install PHP deps**: `composer install`
4. **Run DB migrations**: Apply files in `database/` in order via Supabase SQL editor or `psql`
5. **Start XAMPP** (Apache + MySQL if needed)
6. **Access** at `http://localhost/ums/`

### Mail (Dev)
Start Mailpit for local SMTP testing:
```
assets\vendor\mailpit.exe
```
Mailpit UI: `http://localhost:8025`

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `backend/login.php` | Authenticate user |
| GET/POST | `backend/users.php` | User CRUD |
| GET/POST | `backend/roles_api.php` | Role management |
| GET | `backend/logs.php` | Activity logs |
| GET | `backend/sessions_api.php` | Session list |
| POST | `backend/upload_avatar.php` | Avatar upload |
| POST | `backend/forgot_password_api.php` | Initiate password reset |
| POST | `backend/verify_otp_api.php` | OTP verification |
| POST | `backend/reset_password_api.php` | Set new password |

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full system access |
| `registrar` | User & enrollment management |
| `faculty` | View own profile & schedules |
| `student` | View own records |

---

## Notes
- `tools/debug/` and `assets/vendor/` are excluded from version control (see `.gitignore`)
- All avatar uploads are stored in Supabase Storage; the local `backend/uploads/avatars/` is a fallback
