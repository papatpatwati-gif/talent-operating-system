# Debugging Guide - Aplikasi Tidak Jalan

Jika aplikasi tidak jalan dan console kosong, ikuti panduan berikut:

## 1. Buka DevTools (F12)

- **Chrome/Edge:** Tekan `F12` atau `Ctrl+Shift+I`
- **Firefox:** Tekan `F12`
- **Safari:** Tekan `Cmd+Option+I`

## 2. Cek Tab Console

Buka tab **Console** di DevTools.

### Expected Logs (jika sukses):

```
[TOS] Script.js loading... {pathname: '/app.html', ...}
[TOS] Checking Supabase SDK... {supabaseLoaded: true, ...}
[TOS] Supabase client initialized successfully
[TOS] User session check: {userExists: true, userName: 'John Doe', ...}
[TOS] currentUser initialized: {name: 'John Doe', phone: '628xxx...'}
[TOS] Document already loaded, starting tracking immediately...
[TOS] Script.js loaded successfully
```

## 3. Diagnostik Berdasarkan Output

### Kasus 1: Tidak Ada Log Sama Sekali

**Kemungkinan:** Script.js tidak ter-load

**Solusi:**
- Buka tab **Network** di DevTools
- Cari file `script.js`
- Jika statusnya bukan 200, berarti file tidak ditemukan
- Cek di HTML apakah ada `<script src="script.js"></script>`

### Kasus 2: Log Berhenti di "Script.js loading"

**Kemungkinan:** JavaScript error di awal script

**Solusi:**
- Lihat error message di console (berwarna merah)
- Baca error message dengan seksama
- Lapor ke developer dengan error text-nya

### Kasus 3: Log "No user session found. Redirecting..."

**Kemungkinan:** User belum login

**Solusi:**
1. Pergi ke halaman login: `index.html` atau `/`
2. Masukkan nama dan nomor WhatsApp
3. Klik "Masuk Aplikasi"
4. Baru buka `app.html`

### Kasus 4: Supabase Error

Jika ada error seperti:
```
Presence Tracking Error (Supabase): {code: 'PGRST204', message: "Could not find...", ...}
```

**Solusi:**
- Jalankan SQL dari file: `SUPABASE_FIX_COLUMNS.sql`
- Buka Supabase SQL Editor
- Copy & Paste SQL
- Jalankan dan refresh aplikasi

## 4. Export Console Logs

Untuk membantu debugging, copy semua console output:

1. Klik kanan di console
2. **Save as...** atau select all (Ctrl+A) dan copy
3. Paste ke file dan bagikan ke developer

## 5. Chrome DevTools Tips

### Preserve Logs
- Cek box **"Preserve log"** agar log tidak hilang saat refresh

### Filter Logs
- Ketik `[TOS]` di search box untuk filter hanya aplikasi logs
- Ketik `error` untuk lihat hanya error messages

### Cek Network Errors
- Tab **Network** → Filter `Fetch/XHR`
- Lihat status code request (200 = OK, 400/404/500 = error)
- Klik request untuk lihat response details

## 6. Cek LocalStorage

Buka tab **Application** → **Storage** → **Local Storage** → Pilih URL.

Seharusnya ada key: `app_user` dengan value seperti:
```json
{"name": "John Doe", "phone": "628xxx"}
```

Jika kosong → user belum login, perlu login dulu di `index.html`.

## Butuh Bantuan?

Jika masalah masih berlanjut, kumpulkan informasi berikut:

1. **Full console output** (copy semua logs)
2. **Network tab errors** (ada request yang fail?)
3. **Browser & OS** (Chrome, Firefox, Windows 10, dll)
4. **Error message** (jika ada berwarna merah)
5. **Langkah-langkah** yang sudah dicoba

Share informasi di atas ke developer untuk debugging lebih cepat.
