// ============================================================
// TOS v3.0 — Production JavaScript (Supabase Integrated)
// API Endpoint: /api/generate (sesuai struktur Vercel)
// ============================================================

const API_ENDPOINT = '/api/generate';

// ==================== SUPABASE INITIALIZATION ====================

const SUPABASE_URL = "https://whuzxtfrhdrbfxgkbjmr.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodXp4dGZyaGRyYmZ4Z2tiam1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTc4OTUsImV4cCI6MjEwMjI5Mzg5NX0.bl-QVm-ck5LF61TdbIirk6zBBww7P1ocJEtffrjURes";

// Pastikan Supabase SDK ter-load dari CDN sebelum menginisialisasi
let supabase = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase SDK belum dimuat. Pastikan CDN Supabase ada di <head>.");
}

// ==================== USER SESSION & TRACKING ====================

// 1. Tentukan Nama Aplikasi Tempat Skrip Ini Dipasang
const CURRENT_APP_NAME = "Talent Operating System";

// 2. Ambil Data User dari Browser (Hasil Login)
const savedUser = JSON.parse(localStorage.getItem("app_user"));

// Jika belum login / data kosong, lempar balik ke halaman login
if (!savedUser || !savedUser.name) {
  window.location.href = "index.html";
}

// Set currentUser
const currentUser = {
  name: savedUser.name || "Anonim",
  phone: savedUser.phone || "-"
};

// Helper Pendeteksi Perangkat
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Mobile";
  return "Desktop";
}

// 3. URL Webhook Google Apps Script (Opsional Backup)
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzCaJaVYhxGkpCfEJ2-ga7IedvvAbAq1uOqLBZnZ1WP0ZejDrgHIg-qlBarcSdMa5Zrow/exec";

// 4. Fungsi Log Event ke Supabase & Google Sheets
async function logEvent(eventName = "page_view", extraData = {}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const device = getDeviceType();

  // A. Simpan Log ke Supabase
  if (supabase) {
    const { error } = await supabase
      .from('analytics_logs')
      .insert([
        {
          app_name: CURRENT_APP_NAME,
          user_name: currentUser.name,
          user_phone: currentUser.phone,
          event: eventName,
          path: window.location.pathname,
          device: device,
          date_str: todayStr
        }
      ]);

    if (error) console.error("Tracking Error (Supabase):", error);
  }

  // B. Simpan Otomatis ke Google Sheets (Backup)
  if (GOOGLE_SHEETS_WEBHOOK_URL) {
    const payload = {
      appName: CURRENT_APP_NAME,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      event: eventName,
      path: window.location.pathname,
      device: device,
      userAgent: navigator.userAgent,
      dateStr: todayStr,
      ...extraData
    };

    fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Tracking Error (Sheets):", err));
  }
}

// 5. Update Presence Tracking ke Supabase (online_users)
async function trackPresence() {
  if (!supabase || !currentUser.name) return;

  const { error } = await supabase
    .from('online_users')
    .insert([
      {
        app_name: CURRENT_APP_NAME,
        user_name: currentUser.name,
        user_phone: currentUser.phone,
        path: window.location.pathname,
        device: getDeviceType(),
        last_seen: new Date().toISOString()
      }
    ]);

  if (error) console.error("Presence Tracking Error (Supabase):", error);
}

// Otomatis jalankan tracking saat halaman dibuka
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    logEvent("page_view");
    trackPresence();
  });
} else {
  logEvent("page_view");
  trackPresence();
}

// ==================== UTILITIES ====================

function showToast(msg, type = 'info') {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" aria-hidden="true"></i> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function showConfirm(title, message) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'confirm-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `
      <div class="confirm-box">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="btn ghost" id="cNo" style="padding:10px 24px">Batal</button>
          <button class="btn" id="cYes" style="padding:10px 24px;background:var(--danger)">Ya, Hapus</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#cYes').addEventListener('click', () => { ov.remove(); resolve(true); });
    ov.querySelector('#cNo').addEventListener('click', () => { ov.remove(); resolve(false); });
    ov.addEventListener('click', e => { if (e.target === ov) { ov.remove(); resolve(false); } });
    ov.querySelector('#cYes').focus();
  });
}

function loaderHTML(text) {
  return `<div class="loader-container"><div class="loader"><span></span><span></span><span></span></div><p style="font-size:14px">${text}</p></div>`;
}

function getProgress(total = 14) {
  let d = 0;
  for (let i = 0; i < total; i++) {
    if (localStorage.getItem(`week-${i}`) === 'true') d++;
  }
  return d;
}

function progressHTML(total = 14) {
  const d = getProgress(total);
  const p = Math.round((d / total) * 100);
  return `
    <div class="overall-progress-box">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
        <span><i class="fa-solid fa-trophy" style="color:var(--success)" aria-hidden="true"></i> Progress Keseluruhan</span>
        <span style="color:var(--success);font-weight:700">${d}/${total} Minggu (${p}%)</span>
      </div>
      <div class="overall-bar-bg">
        <div class="overall-bar-fill" style="width:${p}%"></div>
      </div>
      ${d === total ? '<p style="color:var(--success);font-size:13px;margin:10px 0 0;text-align:center">🎉 Selamat! Semua minggu selesai!</p>' : ''}
    </div>`;
}

// ==================== FALLBACK DATA ====================

const FALLBACK = {
  income: {
    scores: [
      { archetype: "MICRO", score: 82 }, { archetype: "REMOTE", score: 68 },
      { archetype: "SERVICE", score: 55 }, { archetype: "CRAFT", score: 40 }
    ],
    top_archetype: "MICRO",
    summary_text: "Berdasarkan tujuan Anda untuk menambah penghasilan, jalur Micro-Entrepreneur sangat relevan. Anda bisa memulai dengan modal minimal menggunakan perangkat yang sudah ada. Fokus utama adalah menemukan niche yang sesuai passion dan membangun skill monetisasi secara bertahap.",
    plan: [
      { title: "Riset Pasar & Identifikasi Niche", detail: "Amati 10 akun/bisnis sukses di bidang yang menarik. Catat pola konten, produk, dan cara mereka menghasilkan uang.", youtube_query: "cara riset pasar online untuk pemula Indonesia" },
      { title: "Bangun Presence Digital Pertama", detail: "Buat 1 akun profesional (Instagram/TikTok/LinkedIn). Tulis bio yang jelas. Posting konten pertama.", youtube_query: "cara membuat profil profesional media sosial" },
      { title: "Pelajari Skill Monetisasi Dasar", detail: "Pilih 1 skill yang bisa menghasilkan uang. Ikuti 3 tutorial gratis dan praktikkan langsung.", youtube_query: "skill menghasilkan uang dari HP" },
      { title: "Buat Portfolio Mini", detail: "Kerjakan 3 project latihan sebagai portfolio awal Anda.", youtube_query: "cara membuat portfolio freelancer pemula" },
      { title: "Tentukan Pricing & Penawaran", detail: "Riset harga pasar. Buat 3 paket layanan (basic/standard/premium).", youtube_query: "cara menentukan harga jasa freelancer" },
      { title: "Cari 3 Klien Pertama", detail: "Tawarkan jasa ke 10 orang di lingkaran terdekat dengan harga spesial.", youtube_query: "cara mendapatkan klien pertama freelancer" },
      { title: "Eksekusi & Kumpulkan Testimoni", detail: "Kerjakan project dengan kualitas terbaik. Minta testimoni tertulis.", youtube_query: "cara meminta testimoni dari klien" },
      { title: "Optimasi Proses Kerja", detail: "Evaluasi workflow. Buat template atau SOP sederhana untuk efisiensi.", youtube_query: "cara membuat SOP bisnis kecil" },
      { title: "Ekspansi ke Platform Freelance", detail: "Daftar di 2 platform freelance. Optimasi profil dengan portfolio.", youtube_query: "cara sukses di Sribulancer Fiverr pemula" },
      { title: "Content Marketing", detail: "Buat konten edukatif tentang skill-mu. Target: 3 konten per minggu.", youtube_query: "content marketing untuk freelancer" },
      { title: "Naikkan Harga", detail: "Evaluasi penghasilan. Naikkan harga 20-30% untuk klien baru.", youtube_query: "kapan menaikkan harga jasa freelance" },
      { title: "Buat Produk Digital", detail: "Ubah expertise jadi produk digital (template/ebook/course mini).", youtube_query: "cara membuat produk digital passive income" },
      { title: "Automasi & Delegasi", detail: "Identifikasi tugas repetitif. Cari tools automasi atau bantuan.", youtube_query: "cara otomasi bisnis online kecil" },
      { title: "Review & Scale Up", detail: "Review 14 minggu. Hitung total penghasilan. Buat rencana 3 bulan.", youtube_query: "cara scale up bisnis freelance" }
    ]
  },
  reorg: {
    scores: [
      { archetype: "REMOTE", score: 80 }, { archetype: "MICRO", score: 65 },
      { archetype: "SERVICE", score: 58 }, { archetype: "CRAFT", score: 42 }
    ],
    top_archetype: "REMOTE",
    summary_text: "Anda dalam fase transisi karier yang membutuhkan strategi bertahap. Jalur Remote Professional cocok karena memungkinkan membangun skill baru sambil tetap stabil.",
    plan: [
      { title: "Self-Assessment & Career Mapping", detail: "Buat daftar skill yang dimiliki dan ingin dipelajari. Gunakan metode ikigai.", youtube_query: "cara menemukan karier cocok ikigai" },
      { title: "Riset Industri Target", detail: "Pilih 3 industri target. Baca 5 artikel tentang tren masing-masing.", youtube_query: "tren industri digital Indonesia 2025" },
      { title: "Identifikasi Skill Gap", detail: "Bandingkan skill saat ini vs yang dibutuhkan. Prioritaskan 3 skill utama.", youtube_query: "cara identifikasi skill gap transisi karier" },
      { title: "Mulai Belajar Skill #1", detail: "Pilih 1 course gratis untuk skill prioritas pertama.", youtube_query: "belajar skill digital gratis pemula" },
      { title: "Praktik & Project Pertama", detail: "Aplikasikan skill baru dalam 1 mini project. Dokumentasikan.", youtube_query: "cara membuat project portfolio career switch" },
      { title: "Networking Strategis", detail: "Hubungi 5 orang di industri target. Ajak coffee chat virtual.", youtube_query: "cara networking pindah karier" },
      { title: "Bangun Personal Brand", detail: "Update LinkedIn serius. Tulis 2 postingan perjalanan belajar.", youtube_query: "cara optimasi LinkedIn career pivot" },
      { title: "Mulai Belajar Skill #2", detail: "Lanjut ke skill prioritas kedua. Cari mentor atau komunitas.", youtube_query: "cara mencari mentor karier online gratis" },
      { title: "Volunteer / Freelance Project", detail: "Cari 1 project volunteer/freelance di bidang baru.", youtube_query: "cara dapat pengalaman kerja bidang baru" },
      { title: "Revamp CV & Portfolio", detail: "Buat CV baru yang menyoroti transferable skills.", youtube_query: "cara membuat CV career changer menarik" },
      { title: "Apply & Interview Prep", detail: "Apply ke 5 posisi. Siapkan cerita career pivot yang compelling.", youtube_query: "cara jawab interview kenapa pindah karier" },
      { title: "Iterasi dari Feedback", detail: "Evaluasi respons. Perbaiki CV, portfolio, atau skill.", youtube_query: "cara evaluasi proses job hunting" },
      { title: "Intensifkan Pencarian", detail: "Tingkatkan jumlah aplikasi. Gunakan multiple channel.", youtube_query: "strategi mencari kerja efektif 2025" },
      { title: "Evaluasi & Keputusan Final", detail: "Review seluruh proses. Buat rencana lanjutan.", youtube_query: "tips tetap semangat mencari kerja baru" }
    ]
  },
  potensi: {
    scores: [
      { archetype: "CRAFT", score: 78 }, { archetype: "MICRO", score: 60 },
      { archetype: "REMOTE", score: 55 }, { archetype: "SERVICE", score: 48 }
    ],
    top_archetype: "CRAFT",
    summary_text: "Anda memiliki potensi kreatif yang belum tereksplorasi penuh. Jalur Digital Craftsman cocok karena memungkinkan bereksperimen dengan berbagai medium digital.",
    plan: [
      { title: "Eksplorasi Minat Tersembunyi", detail: "Buat daftar 10 hal yang membuatmu lupa waktu. Cari polanya.", youtube_query: "cara menemukan bakat terpendam diri sendiri" },
      { title: "Coba 3 Skill Kreatif Berbeda", detail: "Coba menulis, desain, dan editing video. Masing-masing 1 jam.", youtube_query: "skill kreatif dipelajari sendiri" },
      { title: "Deep Dive Skill Favorit", detail: "Pilih 1 yang paling menarik. Ikuti tutorial lengkap pemula.", youtube_query: "cara belajar skill kreatif dari nol" },
      { title: "Buat Karya Pertama", detail: "Selesaikan 1 karya utuh. Tidak perlu sempurna, yang penting selesai.", youtube_query: "tips menyelesaikan project kreatif pertama" },
      { title: "Minta Feedback Jujur", detail: "Bagikan karya ke 5 orang. Catat feedback konstruktif.", youtube_query: "cara menerima menggunakan feedback kreatif" },
      { title: "Pelajari Tools Profesional", detail: "Upgrade ke tools standar industri (Canva Pro/Figma/DaVinci).", youtube_query: "tools gratis terbaik kreator digital" },
      { title: "Buat 3 Karya Lagi", detail: "Produksi 3 karya lebih baik. Terapkan feedback sebelumnya.", youtube_query: "cara meningkatkan kualitas karya kreatif" },
      { title: "Temukan Style Personal", detail: "Analisis karya-karyamu. Identifikasi elemen konsisten.", youtube_query: "cara menemukan gaya kreatif personal" },
      { title: "Bangun Galeri Online", detail: "Buat portfolio di Behance/Medium/YouTube.", youtube_query: "cara membuat portfolio online gratis kreator" },
      { title: "Gabung Komunitas Kreatif", detail: "Join 2 komunitas online. Aktif berkontribusi.", youtube_query: "komunitas kreator digital Indonesia" },
      { title: "Eksplorasi Monetisasi", detail: "Riset cara kreator lain menghasilkan uang.", youtube_query: "cara menghasilkan uang skill kreatif" },
      { title: "Buat Penawaran Pertama", detail: "Pilih 1 model monetisasi. Jual jasa atau produk digital.", youtube_query: "cara mulai jual karya kreatif online" },
      { title: "Konsistensi Kreatif", detail: "Bangun rutinitas berkarya sustainable.", youtube_query: "cara membangun kebiasaan kreatif konsisten" },
      { title: "Refleksi & Roadmap Lanjutan", detail: "Review 14 minggu. Buat rencana 3 bulan.", youtube_query: "cara membuat rencana pengembangan diri jangka panjang" }
    ]
  },
  usaha: {
    scores: [
      { archetype: "MICRO", score: 75 }, { archetype: "SERVICE", score: 72 },
      { archetype: "REMOTE", score: 50 }, { archetype: "CRAFT", score: 45 }
    ],
    top_archetype: "MICRO",
    summary_text: "Anda memiliki semangat entrepreneurial yang kuat. Fokus 14 minggu ini adalah validasi ide bisnis dan membangun fondasi kokoh sebelum scaling.",
    plan: [
      { title: "Brainstorm & Validasi Ide", detail: "Tulis 10 ide bisnis. Pilih 3 paling potensial.", youtube_query: "cara brainstorm ide bisnis menguntungkan" },
      { title: "Riset Kompetitor & Pasar", detail: "Analisis 3 kompetitor per ide. Identifikasi celah pasar.", youtube_query: "cara analisis kompetitor bisnis pemula" },
      { title: "Pilih 1 Ide & Buat MVP", detail: "Pilih 1 ide final. Buat versi paling sederhana untuk diuji.", youtube_query: "cara membuat MVP minimum viable product" },
      { title: "Test ke 10 Calon Customer", detail: "Tawarkan MVP ke 10 orang. Kumpulkan feedback jujur.", youtube_query: "cara validasi ide bisnis customer interview" },
      { title: "Iterasi dari Feedback", detail: "Perbaiki produk berdasarkan feedback.", youtube_query: "cara iterasi produk berdasarkan feedback" },
      { title: "Bangun Brand & Identitas", detail: "Buat nama brand, logo, akun sosial media.", youtube_query: "cara membuat brand bisnis kecil dari nol" },
      { title: "Setup Operasional", detail: "Buat SOP sederhana. Setup tools pembayaran.", youtube_query: "cara setup operasional bisnis kecil" },
      { title: "Strategi Pricing", detail: "Tentukan harga berdasarkan value. Buat 2-3 paket.", youtube_query: "strategi pricing bisnis baru" },
      { title: "Launch & Promosi", detail: "Launching resmi! Promosikan ke lingkaran terdekat.", youtube_query: "cara launching bisnis baru efektif" },
      { title: "Content Marketing", detail: "Buat konten edukatif. 3 konten/minggu.", youtube_query: "content marketing bisnis kecil pemula" },
      { title: "Optimasi Konversi", detail: "Analisis data penjualan. Perbaiki proses.", youtube_query: "cara meningkatkan konversi penjualan online" },
      { title: "Bangun Referral System", detail: "Buat program referral dengan insentif.", youtube_query: "cara membuat program referral bisnis kecil" },
      { title: "Evaluasi Keuangan", detail: "Hitung revenue, cost, profit.", youtube_query: "cara menghitung profit keuangan bisnis kecil" },
      { title: "Scale Up Plan", detail: "Buat rencana scaling: tambah produk, hire tim.", youtube_query: "cara scale up bisnis kecil jadi lebih besar" }
    ]
  }
};

// ==================== WIZARD NAVIGATION ====================

function showStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + n)?.classList.add('active');
  document.querySelectorAll('.ind').forEach((el, i) => {
    el.classList.toggle('active', i + 1 <= n);
    el.removeAttribute('aria-current');
  });
  document.getElementById('ind-' + n)?.setAttribute('aria-current', 'step');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== GENERATE & API HANDLER ====================

async function generateAnalysis(userInputs) {
  const planEl = document.getElementById('plan');
  if (planEl) planEl.innerHTML = loaderHTML("Sedang menganalisis profil dan menyusun roadmap...");

  logEvent("generate_analysis_start");

  try {
    // Call Vercel Serverless Function
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userInputs)
    });

    if (!response.ok) throw new Error("Gagal mengambil respon dari server API");

    const resultData = await response.json();
    saveAndDisplay(userInputs, resultData);
    logEvent("generate_analysis_success");

  } catch (err) {
    console.warn("API Error/Offline, menggunakan Fallback Data:", err);

    const goalKey = userInputs.goal || 'income';
    const fallbackResult = FALLBACK[goalKey] || FALLBACK.income;

    saveAndDisplay(userInputs, fallbackResult);
    showToast('Menggunakan analisis offline (Fallback Mode)', 'info');
    logEvent("generate_analysis_fallback");
  }
}

function saveAndDisplay(profileInputs, analysisData) {
  // Simpan data lengkap ke localStorage untuk download PDF
  localStorage.setItem('savedAnalysis', JSON.stringify({
    profile: profileInputs,
    analysis: analysisData
  }));

  displayResults(analysisData);
}

// ==================== PLAN RENDERING ====================

let planData = [];
let weekIdx = 0;

function renderPlan(data) {
  planData = data;
  const el = document.getElementById('plan');
  if (!el) return;
  const total = data.length;

  // --- SLIDE VIEW ---
  const showSlide = (i) => {
    const item = planData[i];
    if (!item) return;
    const ck = localStorage.getItem(`week-${i}`) === 'true';

    el.innerHTML = `
      <div style="animation:fadeIn .3s ease">
        ${progressHTML(total)}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <span class="badge">Minggu ${i + 1} dari ${total}</span>
          <button id="togV" style="font-size:12px;color:var(--accent);cursor:pointer;background:none;border:1px solid var(--accent);padding:4px 10px;border-radius:6px" aria-label="Lihat semua minggu">
            <i class="fa-solid fa-list" aria-hidden="true"></i> Lihat Semua
          </button>
        </div>
        <div class="week-card-active">
          <label style="display:flex;align-items:flex-start;gap:15px;cursor:pointer">
            <input type="checkbox" class="wcb" data-w="${i}" ${ck ? 'checked' : ''} style="width:20px;height:20px;margin-top:5px;accent-color:var(--success);flex-shrink:0" aria-label="Tandai minggu ${i + 1} selesai">
            <div class="wc" style="${ck ? 'opacity:.5;text-decoration:line-through' : ''}">
              <h3 style="margin:0;color:#fff;font-size:1.1rem">${item.title}</h3>
              <p style="margin-top:10px;color:var(--muted);font-size:14px;line-height:1.7">${item.detail}</p>
              ${item.youtube_query ? `
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(item.youtube_query)}"
                   target="_blank" rel="noopener noreferrer" class="yt-link">
                  <i class="fa-brands fa-youtube" aria-hidden="true"></i> Cari: "${item.youtube_query}"
                </a>` : ''}
            </div>
          </label>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;gap:20px">
          <button class="btn-nav" id="pW" ${i === 0 ? 'disabled' : ''} aria-label="Minggu sebelumnya">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          </button>
          <span style="font-size:13px;color:var(--muted)">Navigasi Minggu</span>
          <button class="btn-nav" id="nW" ${i >= total - 1 ? 'disabled' : ''} aria-label="Minggu berikutnya">
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>`;

    // Event listeners
    document.getElementById('togV')?.addEventListener('click', showList);
    document.querySelector('.wcb')?.addEventListener('change', e => {
      localStorage.setItem(`week-${i}`, e.target.checked);
      const c = e.target.closest('label').querySelector('.wc');
      c.style.opacity = e.target.checked ? '.5' : '1';
      c.style.textDecoration = e.target.checked ? 'line-through' : 'none';
      const pb = document.querySelector('.overall-progress-box');
      if (pb) pb.outerHTML = progressHTML(total);
      if (e.target.checked) showToast(`Minggu ${i + 1} selesai! 🎉`, 'success');
    });
    document.getElementById('pW')?.addEventListener('click', () => {
      if (weekIdx > 0) { weekIdx--; showSlide(weekIdx); }
    });
    document.getElementById('nW')?.addEventListener('click', () => {
      if (weekIdx < total - 1) { weekIdx++; showSlide(weekIdx); }
    });
  };

  // --- LIST VIEW ---
  const showList = () => {
    let h = `
      <div style="animation:fadeIn .3s ease">
        ${progressHTML(total)}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <span class="badge">Daftar ${total} Minggu</span>
          <button id="togV" style="font-size:12px;color:var(--accent);cursor:pointer;background:none;border:1px solid var(--accent);padding:4px 10px;border-radius:6px">
            <i class="fa-solid fa-layer-group" aria-hidden="true"></i> Kembali
          </button>
        </div>
        <div style="display:grid;gap:10px">`;

    planData.forEach((item, i) => {
      const ck = localStorage.getItem(`week-${i}`) === 'true';
      h += `
        <div class="week-item-mini" data-j="${i}" tabindex="0" role="button" aria-label="Minggu ${i + 1}: ${item.title}">
          <div style="min-width:28px;height:28px;border-radius:50%;background:${ck ? 'var(--success)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;flex-shrink:0">
            ${ck ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : i + 1}
          </div>
          <div style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${ck ? 'text-decoration:line-through;opacity:.5' : ''}">
            ${item.title}
          </div>
        </div>`;
    });

    h += `</div></div>`;
    el.innerHTML = h;

    document.querySelectorAll('.week-item-mini').forEach(e => {
      const go = () => { weekIdx = parseInt(e.dataset.j); showSlide(weekIdx); };
      e.addEventListener('click', go);
      e.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
    });
    document.getElementById('togV')?.addEventListener('click', () => showSlide(weekIdx));
  };

  showSlide(weekIdx);
}

// ==================== DISPLAY RESULTS ====================

function displayResults(result) {
  const names = {
    MICRO: '⚡ Micro-Entrepreneur',
    REMOTE: '🌐 Remote Professional',
    SERVICE: '🤝 Service Provider',
    CRAFT: '🎨 Digital Craftsman'
  };
  const top = result.top_archetype?.toUpperCase() || '';

  // Archetype Title
  const titleEl = document.getElementById('archetype-title');
  if (titleEl) {
    titleEl.innerText = `Anda adalah: ${names[top] || result.top_archetype || 'Blueprint Aksi Anda'}`;
  }

  // Progress Bar
  const topScore = Math.max(...result.scores.map(s => s.score));
  setTimeout(() => {
    const progbar = document.getElementById('progbar');
    const scoreVal = document.getElementById('score-val');
    if (progbar) progbar.style.width = topScore + '%';
    if (scoreVal) scoreVal.innerText = topScore + '%';
  }, 300);

  // Summary
  const summaryEl = document.getElementById('summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <strong><i class="fa-solid fa-brain" style="color:var(--accent)" aria-hidden="true"></i> Analisis Konteks:</strong><br><br>
      ${result.summary_text}`;
  }

  // Score Cards
  const paths = document.getElementById('paths');
  if (paths) {
    paths.innerHTML = '<h3 class="section-title" style="margin-top:1.5rem"><i class="fa-solid fa-chart-bar" aria-hidden="true"></i> Skor Relevansi</h3>';

    result.scores.sort((a, b) => b.score - a.score).forEach(o => {
      const isTop = o.archetype.toUpperCase() === top;
      const color = o.score >= 70 ? 'var(--success)' : o.score >= 40 ? 'var(--warning)' : 'var(--danger)';
      const label = o.score >= 70 ? 'Siap Jalan' : o.score >= 40 ? 'Menengah' : 'Perlu Persiapan';
      const d = document.createElement('div');
      d.className = `score-item ${isTop ? 'top' : ''}`;
      d.innerHTML = `
        <div>
          <strong style="font-size:14px">${isTop ? '👑 ' : ''}${o.archetype.toUpperCase()}</strong>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${label}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="score-bar-bg"><div class="score-bar-fill" style="width:${o.score}%;background:${color}"></div></div>
          <span style="font-weight:700;font-size:14px;color:${color};min-width:40px;text-align:right">${o.score}%</span>
        </div>`;
      paths.appendChild(d);
    });
  }

  weekIdx = 0;
  renderPlan(result.plan);
}

// ==================== PDF DOWNLOAD (LENGKAP) ====================

function downloadPDF() {
  const savedData = JSON.parse(localStorage.getItem('savedAnalysis'));
  if (!savedData || !savedData.analysis) { 
    showToast('Tidak ada data untuk diunduh.', 'error'); 
    return; 
  }
  
  showToast('Menyiapkan PDF...', 'info');
  logEvent('download_pdf');

  const saved = savedData.analysis;
  const profile = savedData.profile || {};
  const top = saved.top_archetype?.toUpperCase() || '';
  const names = { MICRO: '⚡ Micro-Entrepreneur', REMOTE: '🌐 Remote Professional', SERVICE: '🤝 Service Provider', CRAFT: '🎨 Digital Craftsman' };
  const sL = { student: 'Pelajar/Mahasiswa', unemployed: 'Mencari Peluang Baru', employee: 'Karyawan Aktif', housewife: 'Ibu Rumah Tangga', entrepreneur: 'Self-Employed / Freelancer' };
  const gL = { income: 'Menambah Side Income', reorg: 'Transisi Karier', potensi: 'Eksplorasi Bakat', usaha: 'Membangun Bisnis' };
  
  // Container Utama untuk PDF
  const el = document.createElement('div');
  el.style.cssText = `
    padding: 30px; 
    font-family: 'Inter', Arial, sans-serif; 
    color: #1f2937; 
    background: #fff; 
    width: 794px;
    box-sizing: border-box;
  `;

  // Template Konten
  el.innerHTML = `
    <style>
      body { font-family: 'Inter', Arial, sans-serif; color: #1f2937; }
      h1, h2, h3 { color: #111827; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { padding: 10px 12px; border: 1px solid #e5e7eb; text-align: left; }
      th { background-color: #f3f4f6; font-weight: 600; font-size: 13px; }
      .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 18px; color: #1e3a8a; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; margin-bottom: 12px; }
      .summary-box { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; font-size: 14px; line-height: 1.6; }
      .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
      .profile-item { display: flex; flex-direction: column; }
      .profile-item span:first-child { font-weight: 600; color: #374151; }
      .profile-item span:last-child { color: #4b5563; }
      .score-bar-bg { background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden; }
      .score-bar-fill { height: 100%; border-radius: 4px; }
      .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>

    <div class="header">
      <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">Talent Operating System (TOS)</h1>
      <p style="color: #4b5563; font-size: 13px; margin: 4px 0;">Laporan Analisis Strategi Personal - ${currentUser.name}</p>
    </div>

    <div class="section">
      <h2 class="section-title">Profil Pengguna</h2>
      <div class="profile-grid">
        <div class="profile-item"><span>Tujuan Utama:</span> <span>${gL[profile.goal] || 'Tidak diketahui'}</span></div>
        <div class="profile-item"><span>Status Profesional:</span> <span>${sL[profile.status] || 'Tidak diketahui'}</span></div>
        <div class="profile-item"><span>Alokasi Waktu:</span> <span>${profile.time || 'Tidak diketahui'}</span></div>
        <div class="profile-item"><span>Perangkat Utama:</span> <span>${profile.device || 'Tidak diketahui'}</span></div>
      </div>
      ${profile.text ? `
        <div class="profile-item" style="margin-top: 10px;">
          <span>Konteks Tambahan:</span>
          <span style="font-style: italic;">"${profile.text}"</span>
        </div>` : ''}
    </div>

    <div class="section">
      <h2 class="section-title">Hasil Analisis AI</h2>
      <h3 style="font-size: 16px; margin-bottom: 8px;">Archetype Utama: ${names[top] || top}</h3>
      <div class="summary-box">
        <p style="margin: 0;">${saved.summary_text}</p>
      </div>
    </div>

    <div class="section">
      <h3 style="font-size: 16px; margin-bottom: 10px;">Skor Relevansi</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">Archetype</th>
            <th>Skor Relevansi</th>
          </tr>
        </thead>
        <tbody>
          ${saved.scores.sort((a, b) => b.score - a.score).map(o => `
            <tr>
              <td style="font-size: 13px;">${names[o.archetype.toUpperCase()] || o.archetype}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="score-bar-bg" style="flex-grow: 1;">
                    <div class="score-bar-fill" style="width:${o.score}%; background-color: #2563eb;"></div>
                  </div>
                  <span style="font-weight: 600; font-size: 12px; min-width: 35px; text-align: right;">${o.score}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">Roadmap 14 Minggu</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 12%; text-align: center;">Minggu</th>
            <th>Rencana Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${saved.plan.map((w, i) => `
            <tr>
              <td style="text-align: center; font-weight: 600; font-size: 14px;">${i + 1}</td>
              <td>
                <div style="font-weight: 600; margin-bottom: 3px; color: #111827; font-size: 13px;">${w.title}</div>
                <div style="color: #4b5563; font-size: 12px; line-height: 1.5;">${w.detail}</div>
                ${w.youtube_query ? `
                  <div style="margin-top: 5px; font-size: 11px; color: #374151;">
                    <strong>Topik Video:</strong> ${w.youtube_query}
                  </div>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Laporan ini dihasilkan secara otomatis oleh Talent Operating System pada ${new Date().toLocaleDateString('id-ID')}</p>
    </div>
  `;

  // Konversi ke File PDF via html2pdf.js
  const opt = {
    margin:       10,
    filename:     `TOS_Analysis_${currentUser.name.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (typeof html2pdf !== 'undefined') {
    html2pdf().set(opt).from(el).save().then(() => {
      showToast('PDF berhasil diunduh!', 'success');
    }).catch(err => {
      console.error("PDF Export Error:", err);
      showToast('Gagal mengunduh PDF.', 'error');
    });
  } else {
    showToast('Library html2pdf belum dimuat pada halaman ini.', 'error');
  }
}