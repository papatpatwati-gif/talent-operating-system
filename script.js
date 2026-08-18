// ============================================================
// TOS v3.0 — Production JavaScript (Supabase Integrated)
// API Endpoint: /api/generate (sesuai struktur Vercel)
// ============================================================

// Global error handler untuk catch semua errors
window.onerror = function(msg, url, lineNo, colNo, error) {
  console.error('Global Error:', {
    message: msg,
    source: url,
    lineno: lineNo,
    colno: colNo,
    error: error
  });
  return false;
};

// Catch unhandled promise rejections
window.onunhandledrejection = function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
};

console.log('[TOS] Script.js loading...', {
  pathname: window.location.pathname,
  href: window.location.href,
  timestamp: new Date().toISOString()
});

const API_ENDPOINT = '/api/generate';

// ==================== SUPABASE INITIALIZATION ====================

const SUPABASE_URL = "https://whuzxtfrhdrbfxgkbjmr.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodXp4dGZyaGRyYmZ4Z2tiam1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTc4OTUsImV4cCI6MjEwMjI5Mzg5NX0.bl-QVm-ck5LF61TdbIirk6zBBww7P1ocJEtffrjURes";

console.log('[TOS] Checking Supabase SDK...', { 
  supabaseLoaded: !!window.supabase,
  createClientExists: !!(window.supabase && typeof window.supabase.createClient === 'function')
});

// Pastikan Supabase SDK ter-load dari CDN sebelum menginisialisasi
let tosSupabase = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  tosSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[TOS] Supabase client initialized successfully');
} else {
  console.warn("[TOS] Supabase SDK belum dimuat. Pastikan CDN Supabase ada di <head>.");
}

// ==================== USER SESSION & TRACKING ====================

// 1. Tentukan Nama Aplikasi Tempat Skrip Ini Dipasang
const CURRENT_APP_NAME = "Talent Operating System";

// 2. Ambil Data User dari Browser (Hasil Login)
const savedUser = JSON.parse(localStorage.getItem("app_user"));

console.log('[TOS] User session check:', {
  userExists: !!savedUser,
  userName: savedUser?.name || 'N/A',
  currentPage: window.location.pathname
});

// Jika belum login / data kosong, lempar balik ke halaman login
if (!savedUser || !savedUser.name) {
  console.log('[TOS] No user session found. Redirecting to index.html...');
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
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx5xeWz2JdpPkpYAf1XqtQSbNchE8Rn-y7nHZ57deO4FBBrv0V9AD5S-IEauwSt01xv5A/exec";

// 4. Fungsi Log Event ke Supabase & Google Sheets
async function logEvent(eventName = "page_view", extraData = {}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const device = getDeviceType();

  // A. Simpan Log ke Supabase
  if (tosSupabase) {
    const { error } = await tosSupabase
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
    name: userData.name,
    phone: userData.phone,
    event: eventName,
    path: window.location.pathname,
    device: getDeviceType()
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
  if (!tosSupabase || !currentUser.name) {
    console.debug("Tracking skipped: Supabase not ready or user not logged in");
    return;
  }

  try {
    const payload = {
    appName: CURRENT_APP_NAME,
    name: userData.name,
    phone: userData.phone,
    event: eventName,
    path: window.location.pathname,
    device: getDeviceType()
  };

    };

    const { data, error } = await tosSupabase
      .from('online_users')
      .insert([payload]);

    if (error) {
      console.error("Presence Tracking Error (Supabase):", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.debug("Presence tracked successfully", data);
    }
  } catch (err) {
    console.error("Presence Tracking Exception:", err);
  }
}

console.log('[TOS] currentUser initialized:', currentUser);

// Otomatis jalankan tracking saat halaman dibuka
if (document.readyState === 'loading') {
  console.log('[TOS] Document still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('[TOS] DOMContentLoaded fired, starting tracking...');
    try {
      await logEvent("page_view");
      console.log('[TOS] logEvent completed');
    } catch (err) {
      console.error('[TOS] logEvent failed:', err);
    }
    
    try {
      await trackPresence();
      console.log('[TOS] trackPresence completed');
    } catch (err) {
      console.error('[TOS] trackPresence failed:', err);
    }
  });
} else {
  console.log('[TOS] Document already loaded, starting tracking immediately...');
  (async () => {
    try {
      await logEvent("page_view");
      console.log('[TOS] logEvent completed');
    } catch (err) {
      console.error('[TOS] logEvent failed:', err);
    }
    
    try {
      await trackPresence();
      console.log('[TOS] trackPresence completed');
    } catch (err) {
      console.error('[TOS] trackPresence failed:', err);
    }
  })();
}

console.log('[TOS] Script.js loaded successfully');

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[TOS] Setting up UI event listeners...');
  
  // Setup Start Button (Landing → Wizard)
  const startBtn = document.getElementById('startButton');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      console.log('[TOS] startButton clicked, showing wizard...');
      const landing = document.getElementById('landing-container');
      const wizard = document.getElementById('wizard-container');
      if (landing) landing.style.display = 'none';
      if (wizard) wizard.style.display = 'block';
      showStep(1);
      logEvent('wizard_started');
    });
    console.log('[TOS] startButton listener attached');
  } else {
    console.warn('[TOS] startButton not found in DOM');
  }
  
  // Setup Navigation Buttons
  const toStep2Btn = document.getElementById('toStep2');
  if (toStep2Btn) {
    toStep2Btn.addEventListener('click', () => {
      console.log('[TOS] Moving to step 2...');
      showStep(2);
    });
  }
  
  const backToStep1Btn = document.getElementById('backToStep1');
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener('click', () => {
      console.log('[TOS] Moving back to step 1...');
      showStep(1);
    });
  }
  
  const backToStep2Btn = document.getElementById('backToStep2');
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener('click', () => {
      console.log('[TOS] Moving back to step 2...');
      showStep(2);
    });
  }
  
  // Setup Generate Button (Analyze)
const generateBtn = document.getElementById('generateButton');
if (generateBtn) {
  generateBtn.addEventListener('click', async (e) => {
    // 1. Cegah form submit bawaan (jika tombol ada di dalam tag <form>)
    if (e) e.preventDefault();

    // 2. Anti-Double Click: Jika sedang proses, abaikan klik berikutnya
    if (generateBtn.disabled) return;

    console.log('[TOS] generateButton clicked, collecting form data...');

    const inputs = {
      goal: document.getElementById('q_goal')?.value,
      status: document.getElementById('q_status')?.value,
      time: document.getElementById('q_time')?.value,
      device: document.getElementById('q_device')?.value,
      text: document.getElementById('q_text')?.value || '',
      obstacles: document.getElementById('q_obstacles')?.value || '',
      skills: document.getElementById('q_skills')?.value || ''
    };

    console.log('[TOS] Form inputs collected:', inputs);

    if (!inputs.goal || !inputs.status || !inputs.time || !inputs.device) {
      showToast('Mohon lengkapi semua pertanyaan wajib', 'error');
      console.warn('[TOS] Incomplete form data');
      return;
    }

    // 3. Simpan teks asli & set status Loading pada tombol
    const originalText = generateBtn.innerHTML;
    try {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Menganalisa...
        </span>
      `;

      // Eksekusi fungsi AI Analysis
      await generateAnalysis(inputs);

    } catch (err) {
      console.error('[TOS] Error inside generateAnalysis:', err);
      showToast('Gagal memproses analisa: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      // 4. Kembalikan kondisi tombol seperti semula
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalText;
    }
  });

  console.log('[TOS] generateButton listener attached');
} else {
  console.warn('[TOS] generateButton not found in DOM');
}

// Setup PDF Download Button
const downloadBtn = document.getElementById('downloadButton');
if (downloadBtn) {
  downloadBtn.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    console.log('[TOS] downloadButton clicked');
    downloadPDF();
  });
}
  
  // Setup Share Button
  const shareBtn = document.getElementById('shareButton');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      console.log('[TOS] shareButton clicked');
      if (navigator.share) {
        const url = window.location.href;
        navigator.share({ title: 'Talent Operating System', text: 'Check my career analysis!', url });
      } else {
        showToast('Fitur share tidak didukung di browser ini', 'info');
      }
    });
  }
  
  // Setup Restart Button
  const restartBtn = document.getElementById('restartButton');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      console.log('[TOS] restartButton clicked');
      localStorage.removeItem('savedAnalysis');
      location.reload();
    });
  }
  
  console.log('[TOS] All UI listeners attached successfully');
});

console.log('[TOS] Initialization code registered');

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

// ==================== HELPER / UTILITY FUNCTIONS ====================

function progressHTML(total) {
  let completed = 0;
  for (let i = 0; i < total; i++) {
    if (localStorage.getItem(`week-${i}`) === 'true') completed++;
  }
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return `
    <div class="overall-progress-box" style="margin-bottom:15px;background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:6px">
        <span>Progres Pengerjaan Roadmap</span>
        <span style="font-weight:700;color:var(--accent)">${completed}/${total} Minggu (${pct}%)</span>
      </div>
      <div style="background:rgba(255,255,255,0.1);height:6px;border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:var(--success);transition:width .3s ease"></div>
      </div>
    </div>
  `;
}

function loaderHTML(msg) {
  return `
    <div style="text-align:center;padding:40px 20px;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--accent);margin-bottom:15px"></i>
      <p style="color:var(--muted);font-size:14px">${msg}</p>
    </div>
  `;
}

function normalizePlanData(planArray) {
  if (!Array.isArray(planArray)) return [];
  return planArray.map((item, idx) => {
    const title = item.title || item.focus || `Minggu ${item.week || idx + 1}`;
    let detail = item.detail || '';
    if (!detail && Array.isArray(item.tasks)) {
      detail = item.tasks.map(t => `• ${t}`).join('<br>');
    } else if (!detail && typeof item.tasks === 'string') {
      detail = item.tasks;
    }
    const youtube_query = item.youtube_query || item.focus || title;
    return {
      week: item.week || idx + 1,
      title: title,
      detail: detail || 'Fokus pada implementasi strategi mingguan.',
      youtube_query: youtube_query
    };
  });
}

// ==================== GENERATE & API HANDLER ====================

async function generateAnalysis(userInputs) {
  const planEl = document.getElementById('plan');
  if (planEl) planEl.innerHTML = loaderHTML("Sedang menganalisis profil dan menyusun roadmap...");

  if (typeof logEvent === 'function') logEvent("generate_analysis_start");

  try {
    // 1. Buat prompt dengan instruksi JSON eksplisit
    const prompt = `Anda adalah Career AI Advisor berpengalaman. Analisis profil pengguna berikut dan berikan strategi karier yang personal dan actionable.

PROFIL PENGGUNA:
- Aspirasi Utama: ${userInputs.goal || 'Tidak disebutkan'}
- Status Profesional: ${userInputs.status || 'Tidak disebutkan'}
- Alokasi Waktu: ${userInputs.time || 'Tidak disebutkan'}
- Perangkat Utama: ${userInputs.device || 'Tidak disebutkan'}
${userInputs.text ? `- Konteks Tambahan: ${userInputs.text}` : ''}
${userInputs.obstacles ? `- Hambatan/Tantangan: ${userInputs.obstacles}` : ''}
${userInputs.skills ? `- Skill Saat Ini: ${userInputs.skills}` : ''}

INSTRUKSI OUTPUT:
Berikan response HANYA berupa JSON VALID murni (tanpa Markdown, tanpa backtick \`\`\`json, tanpa teks pembuka/penutup). Struktur wajib:

{
  "top_archetype": "MICRO",
  "summary_text": "Ringkasan 2-3 paragraf rekomendasi karier berdasarkan profil dalam Bahasa Indonesia.",
  "scores": [
    {"archetype": "MICRO", "score": 85},
    {"archetype": "REMOTE", "score": 70},
    {"archetype": "SERVICE", "score": 60},
    {"archetype": "CRAFT", "score": 50}
  ],
  "plan": [
    {
      "week": 1,
      "title": "Judul fokus minggu 1",
      "detail": "Penjelasan tugas dan langkah praktis minggu 1",
      "youtube_query": "Kata kunci pencarian tutorial youtube"
    }
  ]
}

KETENTUAN PENTING:
- JSON HARUS valid dan dapat di-parse secara langsung.
- Scores harus number 0-100.
- Plan harus array berisi 14 item (minggu 1 hingga 14).
- Setiap task harus praktis dan dapat dikerjakan.
- Archetype yang tersedia: MICRO, REMOTE, SERVICE, CRAFT.`;

    console.log('[TOS] Sending API request, prompt length:', prompt.length);

    const endpoint = typeof API_ENDPOINT !== 'undefined' ? API_ENDPOINT : '/api/generate';

    // 2. Call API Endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    console.log('[TOS] API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[TOS] API Error response:', errorText);
      throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
    }

    const rawResponse = await response.json();
    console.log('[TOS] Raw API Response received:', rawResponse);

    // 3. Ekstraksi string teks dari berbagai kemungkinan struktur API
    let rawText = "";
    if (typeof rawResponse === 'string') {
      rawText = rawResponse;
    } else if (rawResponse.result) {
      rawText = typeof rawResponse.result === 'string' ? rawResponse.result : JSON.stringify(rawResponse.result);
    } else if (rawResponse.text) {
      rawText = rawResponse.text;
    } else if (rawResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = rawResponse.candidates[0].content.parts[0].text; // Gemini Direct
    } else if (rawResponse.choices?.[0]?.message?.content) {
      rawText = rawResponse.choices[0].message.content; // OpenAI / Groq
    } else {
      rawText = JSON.stringify(rawResponse);
    }

    // 4. Clean Markdown Code Blocks & Parse JSON
    let parsedData = null;
    try {
      let cleanedText = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const jsonMatch = cleanedText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('[TOS] Failed to parse JSON response from AI:', parseErr, '\nRaw text was:', rawText);
      throw new Error('Format respon AI tidak dapat di-parse sebagai JSON');
    }

    // 5. Validasi & Normalisasi Atribut Utama
    if (!parsedData || !parsedData.top_archetype) {
      console.warn('[TOS] Parsed JSON lacks required fields:', parsedData);
      throw new Error('Data analisis dari AI tidak lengkap');
    }

    parsedData.plan = normalizePlanData(parsedData.plan);

    console.log('[TOS] API Success, parsed result archetype:', parsedData.top_archetype);
    
    // Tampilkan & simpan data hasil analisis sukses
    saveAndDisplay(userInputs, parsedData);
    if (typeof logEvent === 'function') logEvent("generate_analysis_success");

  } catch (err) {
    console.error("[TOS] API Error/Parsing Failed, menggunakan Fallback Data:", err);

    const goalKey = userInputs.goal || 'income';
    let fallbackResult = (typeof FALLBACK !== 'undefined' && FALLBACK[goalKey]) 
      ? FALLBACK[goalKey] 
      : (typeof FALLBACK !== 'undefined' ? FALLBACK.income : null);

    if (fallbackResult) {
      fallbackResult = JSON.parse(JSON.stringify(fallbackResult));
      fallbackResult.plan = normalizePlanData(fallbackResult.plan);
      saveAndDisplay(userInputs, fallbackResult);
      if (typeof showToast === 'function') {
        showToast('Menggunakan analisis offline (Fallback Mode)', 'info');
      }
    } else {
      if (planEl) {
        planEl.innerHTML = `<div style="padding:15px;background:rgba(239,68,68,0.1);color:#f87171;border:1px solid rgba(239,68,68,0.2);border-radius:8px">
          Gagal memuat analisis: ${err.message}. Silakan coba beberapa saat lagi.
        </div>`;
      }
    }
    if (typeof logEvent === 'function') logEvent("generate_analysis_fallback");
  }
}

function saveAndDisplay(profileInputs, analysisData) {
  // Simpan data lengkap ke localStorage untuk download PDF / reload
  try {
    localStorage.setItem('savedAnalysis', JSON.stringify({
      profile: profileInputs,
      analysis: analysisData,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('[TOS] Gagal menyimpan ke localStorage:', e);
  }

  // Panggil fungsi render utama
  if (typeof displayResults === 'function') {
    displayResults(analysisData);
  } else {
    console.error('[TOS] Fungsi displayResults(analysisData) tidak ditemukan!');
  }

  // Pindahkan Tampilan Wizard ke Step 3 (Hasil)
  showStep(3);
}

// ==================== PLAN RENDERING ====================

let planData = [];
let weekIdx = 0;

function renderPlan(data) {
  planData = Array.isArray(data) ? data : [];
  const el = document.getElementById('plan');
  if (!el) return;
  const total = planData.length;

  if (total === 0) {
    el.innerHTML = '<p style="color:var(--muted);text-align:center">Roadmap tidak tersedia.</p>';
    return;
  }

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
              <div style="margin-top:10px;color:var(--muted);font-size:14px;line-height:1.7">${item.detail}</div>
              ${item.youtube_query ? `
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(item.youtube_query)}"
                   target="_blank" rel="noopener noreferrer" class="yt-link" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;color:#ef4444;text-decoration:none;font-size:13px;font-weight:600">
                  <i class="fa-brands fa-youtube" aria-hidden="true"></i> Cari Video: "${item.youtube_query}"
                </a>` : ''}
            </div>
          </label>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin-top:20px">
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
      if (c) {
        c.style.opacity = e.target.checked ? '.5' : '1';
        c.style.textDecoration = e.target.checked ? 'line-through' : 'none';
      }
      const pb = document.querySelector('.overall-progress-box');
      if (pb) pb.outerHTML = progressHTML(total);
      if (e.target.checked && typeof showToast === 'function') {
        showToast(`Minggu ${i + 1} selesai! 🎉`, 'success');
      }
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
        <div class="week-item-mini" data-j="${i}" tabindex="0" role="button" aria-label="Minggu ${i + 1}: ${item.title}" style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;cursor:pointer">
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
  if (!result) return;

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

  // Progress Bar & Top Score
  const scores = Array.isArray(result.scores) ? result.scores : [];
  const topScore = scores.length > 0 ? Math.max(...scores.map(s => s.score || 0)) : 85;

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
      ${(result.summary_text || 'Ringkasan tidak tersedia.').replace(/\n/g, '<br>')}`;
  }

  // Score Cards
  const paths = document.getElementById('paths');
  if (paths && scores.length > 0) {
    paths.innerHTML = '<h3 class="section-title" style="margin-top:1.5rem"><i class="fa-solid fa-chart-bar" aria-hidden="true"></i> Skor Relevansi</h3>';

    [...scores].sort((a, b) => b.score - a.score).forEach(o => {
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
    if (typeof showToast === 'function') showToast('Tidak ada data untuk diunduh.', 'error'); 
    return; 
  }
  
  if (typeof showToast === 'function') showToast('Menyiapkan PDF...', 'info');
  if (typeof logEvent === 'function') logEvent('download_pdf');

  const saved = savedData.analysis;
  const profile = savedData.profile || {};
  const top = saved.top_archetype?.toUpperCase() || '';
  const names = { MICRO: '⚡ Micro-Entrepreneur', REMOTE: '🌐 Remote Professional', SERVICE: '🤝 Service Provider', CRAFT: '🎨 Digital Craftsman' };
  const sL = { student: 'Pelajar/Mahasiswa', unemployed: 'Mencari Peluang Baru', employee: 'Karyawan Aktif', housewife: 'Ibu Rumah Tangga', entrepreneur: 'Self-Employed / Freelancer' };
  const gL = { income: 'Menambah Side Income', reorg: 'Transisi Karier', potensi: 'Eksplorasi Bakat', usaha: 'Membangun Bisnis' };
  
  const userName = (typeof currentUser !== 'undefined' && currentUser?.name) ? currentUser.name : 'User';

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

  // Template Konten PDF
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
      <p style="color: #4b5563; font-size: 13px; margin: 4px 0;">Laporan Analisis Strategi Personal - ${userName}</p>
    </div>

    <div class="section">
      <h2 class="section-title">Profil Pengguna</h2>
      <div class="profile-grid">
        <div class="profile-item"><span>Tujuan Utama:</span> <span>${gL[profile.goal] || profile.goal || 'Tidak diketahui'}</span></div>
        <div class="profile-item"><span>Status Profesional:</span> <span>${sL[profile.status] || profile.status || 'Tidak diketahui'}</span></div>
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
          ${(saved.scores || []).sort((a, b) => b.score - a.score).map(o => `
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
          ${(saved.plan || []).map((w, i) => `
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
    filename:     `TOS_Analysis_${userName.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (typeof html2pdf !== 'undefined') {
    html2pdf().set(opt).from(el).save().then(() => {
      if (typeof showToast === 'function') showToast('PDF berhasil diunduh!', 'success');
    }).catch(err => {
      console.error("PDF Export Error:", err);
      if (typeof showToast === 'function') showToast('Gagal mengunduh PDF.', 'error');
    });
  } else {
    if (typeof showToast === 'function') showToast('Library html2pdf belum dimuat pada halaman ini.', 'error');
  }
}