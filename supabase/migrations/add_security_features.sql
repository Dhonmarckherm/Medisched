-- Security Enhancement Migrations

-- 1. Add account lockout columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 2. Create login_logs table for audit trail
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'failed', -- 'success', 'failed', 'locked', 'rate_limited'
  failure_reason TEXT, -- 'invalid_password', 'invalid_email', 'account_locked', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(status);

-- RLS for login_logs
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login logs"
  ON login_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Service can insert login logs"
  ON login_logs FOR INSERT
  WITH CHECK (true);

-- 3. Create rate_limits table for persistent rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY, -- e.g., 'login:192.168.1.1'
  count INTEGER DEFAULT 1,
  reset_at BIGINT NOT NULL, -- Unix timestamp in ms
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- RLS for rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No user access needed - only service role key accesses this
-- But we enable RLS as a safety measure
