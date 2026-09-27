-- User OTPs table for Supabase PostgreSQL
-- Part of the UMS schema (ums_pg.sql). Included here for reference.
-- The table user_otps_ums is already created by ums_pg.sql.

CREATE TABLE IF NOT EXISTS user_otps_ums (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL,
    otp_code   VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used    SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_otps_user
        FOREIGN KEY (user_id) REFERENCES users_ums(id)
        ON DELETE CASCADE
);
