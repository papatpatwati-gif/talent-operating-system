# Supabase Setup Guide

Panduan untuk setup database Supabase untuk Talent Operating System.

## Prerequisites

- Akun Supabase (https://supabase.com)
- Project Supabase sudah dibuat

## Setup Steps

### 1. Akses Supabase SQL Editor

1. Login ke Supabase Dashboard
2. Pilih project: `whuzxtfrhdrbfxgkbjmr`
3. Buka **SQL Editor** di sidebar kiri

### 2. Run Migrations

Salin dan jalankan SQL migrations sesuai urutan:

#### A. Buat Tabel `online_users` (Presence Tracking)

Buka file: `supabase/migrations/create_online_users_table.sql`
Copy seluruh SQL dan jalankan di Supabase SQL Editor.

**Tabel ini mencatat pengguna yang sedang aktif (online):**
- `app_name`: Nama aplikasi
- `user_name`: Nama pengguna
- `user_phone`: Nomor WhatsApp pengguna
- `path`: URL path yang dikunjungi
- `device`: Tipe perangkat (Mobile/Tablet/Desktop)
- `last_seen`: Timestamp terakhir terlihat

#### B. Buat Tabel `analytics_logs` (Event Tracking)

Buka file: `supabase/migrations/create_analytics_logs_table.sql`
Copy seluruh SQL dan jalankan di Supabase SQL Editor.

**Tabel ini mencatat event pengguna untuk analytics:**
- `app_name`: Nama aplikasi
- `user_name`: Nama pengguna
- `user_phone`: Nomor WhatsApp
- `event`: Nama event (e.g., "page_view", "analyze_career", dll)
- `path`: URL path saat event terjadi
- `device`: Tipe perangkat
- `date_str`: Tanggal event (format: YYYY-MM-DD)

### 3. Verify Tables Created

Buka **Table Editor** di Supabase Dashboard dan verify:
- ✅ Tabel `online_users` ada
- ✅ Tabel `analytics_logs` ada
- ✅ Semua kolom sesuai skema

### 4. Check Row Level Security (RLS)

- Buka **Authentication** → **Policies**
- Verify bahwa policies sudah dibuat untuk kedua tabel
- Policies memungkinkan anonymous inserts untuk tracking publik

## Troubleshooting

### Error: "Column 'device' not found"
- Jalankan migration untuk `create_online_users_table.sql` ulang
- Pastikan table benar-benar dibuat

### Error: "Permission denied for insert"
- Check RLS policies di Supabase
- Pastikan policies memungkinkan anonymous user untuk insert

### Error: 400 Bad Request
- Pastikan nama tabel (case-sensitive): `online_users`, `analytics_logs`
- Pastikan nama kolom sesuai dengan query di script.js

## Cleanup Old Data

Untuk membersihkan data lama, jalankan:

```sql
SELECT cleanup_old_online_users();
SELECT cleanup_old_analytics_logs();
```

Atau aktifkan automated cleanup via Supabase cron jobs.

## References

- Supabase Docs: https://supabase.com/docs
- SQL Editor: https://supabase.com/docs/guides/database/sql-editor
- RLS: https://supabase.com/docs/guides/auth/row-level-security
