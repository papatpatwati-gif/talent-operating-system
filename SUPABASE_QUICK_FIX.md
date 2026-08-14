# Quick Fix: Supabase Database Schema

**Error:** `PGRST204: Could not find the 'device' column of 'online_users' in the schema cache`

**Penyebab:** Tabel `online_users` belum dibuat atau skema tidak lengkap.

## Solusi Cepat (2 menit)

### 1. Buka Supabase SQL Editor

- Login ke https://app.supabase.com
- Pilih project: **whuzxtfrhdrbfxgkbjmr**
- Klik **SQL Editor** di sidebar kiri
- Klik **New Query**

### 2. Copy & Paste SQL Berikut

```sql
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

-- Enable RLS
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous inserts
CREATE POLICY "Allow public insert" ON online_users
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow public insert" ON analytics_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_online_users_last_seen ON online_users(last_seen);
CREATE INDEX idx_analytics_logs_date_str ON analytics_logs(date_str);
```

### 3. Jalankan Query

Klik tombol **Run** atau tekan `Ctrl+Enter`

Tunggu sampai selesai ✅

### 4. Verifikasi

- Buka tab **Table Editor** di Supabase
- Lihat apakah `online_users` dan `analytics_logs` sudah ada
- Refresh aplikasi Anda dan error seharusnya hilang ✅

## Selesai!

Aplikasi sekarang siap untuk tracking pengguna dan analytics! 🎉
