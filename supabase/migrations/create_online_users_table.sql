-- Migration: Create online_users table for presence tracking
-- Run this in Supabase SQL Editor

-- Create online_users table
CREATE TABLE IF NOT EXISTS online_users (
  id BIGSERIAL PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  path TEXT,
  device TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_online_users_app_name ON online_users(app_name);
CREATE INDEX IF NOT EXISTS idx_online_users_user_name ON online_users(user_name);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen);

-- Enable RLS (Row Level Security)
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous inserts (needed for public tracking)
CREATE POLICY "Allow public insert" ON online_users
  FOR INSERT WITH CHECK (true);

-- Create policy for reading own data
CREATE POLICY "Allow public select" ON online_users
  FOR SELECT USING (true);

-- Optional: Create a function to clean up old records
CREATE OR REPLACE FUNCTION cleanup_old_online_users()
RETURNS void AS $$
BEGIN
  DELETE FROM online_users 
  WHERE last_seen < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
