-- Migration: Create analytics_logs table for event tracking
-- Run this in Supabase SQL Editor

-- Create analytics_logs table
CREATE TABLE IF NOT EXISTS analytics_logs (
  id BIGSERIAL PRIMARY KEY,
  app_name TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT,
  event TEXT NOT NULL,
  path TEXT,
  device TEXT,
  date_str DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_logs_app_name ON analytics_logs(app_name);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_event ON analytics_logs(event);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_date_str ON analytics_logs(date_str);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_user_name ON analytics_logs(user_name);

-- Enable RLS (Row Level Security)
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous inserts (needed for public tracking)
CREATE POLICY "Allow public insert" ON analytics_logs
  FOR INSERT WITH CHECK (true);

-- Create policy for reading all data
CREATE POLICY "Allow public select" ON analytics_logs
  FOR SELECT USING (true);

-- Optional: Create a function to clean up old records (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
