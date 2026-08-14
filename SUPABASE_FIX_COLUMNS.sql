-- Fix: Add missing columns to online_users table
-- Run this in Supabase SQL Editor if columns are missing

-- Check if columns exist, add if missing
ALTER TABLE online_users ADD COLUMN IF NOT EXISTS app_name TEXT;
ALTER TABLE online_users ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE online_users ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE online_users ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE online_users ADD COLUMN IF NOT EXISTS device TEXT;
ALTER TABLE online_users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;
ALTER TABLE online_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_online_users_app_name ON online_users(app_name);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen);

-- Enable RLS if not already enabled
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Allow public insert" ON online_users;
DROP POLICY IF EXISTS "Allow public select" ON online_users;

-- Create new policies
CREATE POLICY "Allow public insert" ON online_users
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow public select" ON online_users
  FOR SELECT USING (true);

-- Similarly for analytics_logs
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS app_name TEXT;
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS event TEXT;
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS device TEXT;
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS date_str DATE;
ALTER TABLE analytics_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_logs_event ON analytics_logs(event);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_date_str ON analytics_logs(date_str);

-- Enable RLS
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Allow public insert" ON analytics_logs;
DROP POLICY IF EXISTS "Allow public select" ON analytics_logs;

CREATE POLICY "Allow public insert" ON analytics_logs
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow public select" ON analytics_logs
  FOR SELECT USING (true);
