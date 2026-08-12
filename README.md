# Talent Operating System

Talent Operating System adalah aplikasi web yang membantu pengguna mengeksplorasi arah karier, gaya kerja, dan roadmap pengembangan diri secara personal menggunakan AI.

## Fitur utama

- Wizard analisis karier berbasis profil pengguna
- Penilaian archetype karier seperti MICRO, REMOTE, SERVICE, dan CRAFT
- Roadmap 14 minggu yang bisa disesuaikan
- Simpan hasil di browser menggunakan localStorage
- Export PDF dan fitur bagikan hasil
- Tidak memerlukan login untuk penggunaan dasar

## Struktur aplikasi

- index.html: halaman utama dan wizard analisis
- script.js: logika utama aplikasi, AI prompt, dan hasil analisis
- style.css: desain UI aplikasi
- panduan.html: panduan penggunaan
- about.html: halaman profile
- privacy.html dan terms.html: kebijakan dan syarat layanan

## Jalankan lokal

Buka direktori proyek lalu jalankan server statis sederhana:

python3 -m http.server 8000

Lalu buka:

http://localhost:8000

## Catatan produksi

- Data analisis disimpan di browser untuk menjaga pengalaman tanpa login
- API AI diproses melalui endpoint server yang didefinisikan di folder api
- Project ini siap dipakai untuk deployment statis seperti Vercel atau hosting web umum
