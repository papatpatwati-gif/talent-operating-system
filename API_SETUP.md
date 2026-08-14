# Setup API & Environment Variables

## ⚠️ Problem Saat Ini

API endpoint `/api/generate` mengembalikan error 400 karena:
- ❌ API key belum di-setup di Vercel environment variables

## ✅ Solusi: Setup Gemini API Key

### 1. Dapatkan API Key dari Google AI Studio

1. Buka https://aistudio.google.com/app/apikey
2. Login dengan Google Account Anda
3. Klik **"Create API Key"**
4. Copy API key yang dihasilkan

### 2. Setup di Vercel Dashboard

1. Buka https://vercel.com/dashboard
2. Pilih project: **talent-operating-system**
3. Klik tab **Settings**
4. Cari bagian **Environment Variables**
5. Tambahkan variable baru:

   | Nama | Nilai |
   |------|-------|
   | `GEMINI_API_KEY` | [Paste API Key dari step 1] |

6. Klik **Save**

### 3. Deploy Perubahan

Setelah menambahkan env variable:

```bash
git add .
git commit -m "docs: Add API setup guide"
git push
```

Vercel otomatis akan re-deploy dengan env variables baru.

### 4. Test API

Refresh aplikasi dan coba "Analisis Profil" lagi.

**Expected behavior:**
```
[TOS] Sending API request with prompt length: 1245
[TOS] API Response status: 200
[TOS] API Success, result data received
```

## 🔧 Alternative: Development Lokal

Untuk test lokal dengan Node.js:

### 1. Buat file `.env.local`

```bash
cat > .env.local << 'EOF'
GEMINI_API_KEY=paste-your-api-key-here
EOF
```

### 2. Install Dependencies (jika perlu)

```bash
npm install
```

### 3. Setup Vercel CLI (Optional)

```bash
npm install -g vercel
vercel link
vercel env pull
```

### 4. Test Lokal

```bash
vercel dev
```

Buka http://localhost:3000 dan test aplikasi.

## 📝 Environment Variables Reference

Sistem mendukung beberapa nama API key:
- `GEMINI_API_KEY` ← **Preferred**
- `GOOGLE_API_KEY`
- `API_KEY`

Pastikan salah satu sudah di-set di Vercel Environment Variables.

## ❓ Troubleshooting

### Error: "Layanan AI belum dikonfigurasi"

**Penyebab:** API key tidak ditemukan

**Solusi:**
1. Verify API key sudah di-set di Vercel
2. Check Environment Variables di Vercel Dashboard
3. Re-deploy dengan `git push`
4. Clear browser cache (Ctrl+Shift+Delete)

### Error: "Gagal mengambil respon dari server API"

**Penyebab:** Bisa API key tidak valid atau API rate limit

**Solusi:**
1. Verify API key di https://aistudio.google.com/app/apikey
2. Try again dalam beberapa menit
3. Check console logs untuk detail error

## 🚀 Production Checklist

- [ ] API key di-set di Vercel Environment Variables
- [ ] Project ter-deploy di Vercel
- [ ] Test "Analisis Profil" berhasil
- [ ] PDF download berfungsi
- [ ] Share button berfungsi

## Referensi

- Google AI Studio: https://aistudio.google.com
- Vercel Environment: https://vercel.com/docs/concepts/environment-variables
- Gemini API Docs: https://ai.google.dev/
