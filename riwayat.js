// ============================================================
// TOS v3.0 — Riwayat Analisis
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBgT0-4srIeRDgsz1DeqGKyrmd7ucOTBFU",
  authDomain: "talent-operating-system.firebaseapp.com",
  projectId: "talent-operating-system",
  storageBucket: "talent-operating-system.firebasestorage.app",
  messagingSenderId: "625077043272",
  appId: "1:625077043272:web:a3373a53b81025f850987d",
  measurementId: "G-4JX31C2VS0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const historyContainer = document.getElementById('history-container');

/**
 * Memuat riwayat analisis dari Firestore untuk pengguna yang sedang login.
 * @param {firebase.User} user Objek pengguna dari Firebase Auth.
 */
async function loadHistory(user) {
  // Objek untuk memetakan kode archetype ke nama lengkapnya
  const n = { MICRO: '⚡ Micro-Entrepreneur', REMOTE: '🌐 Remote Professional', SERVICE: '🤝 Service Provider', CRAFT: '🎨 Digital Craftsman' };
  
  try {
    const querySnapshot = await db.collection('users').doc(user.uid).collection('analyses')
      .orderBy('timestamp', 'desc')
      .limit(20) // Batasi untuk 20 riwayat terbaru
      .get();

    if (querySnapshot.empty) {
      historyContainer.innerHTML = '<p style="text-align:center; color: var(--muted);">Anda belum memiliki riwayat analisis tersimpan.</p>';
      return;
    }

    let html = '<div class="history-list">';
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp?.toDate().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) || 'Tanggal tidak diketahui';
      const archetype = data.archetype?.toUpperCase() || 'UNKNOWN'; // Ambil kode archetype

      html += `
        <div class="history-item" data-id="${doc.id}" tabindex="0" role="button" aria-label="Muat analisis tanggal ${date}">
          <div class="history-item-icon">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
          <div class="history-item-content">
            <div class="history-item-title">${n[archetype] || data.archetype || 'Analisis Lama'}</div>
            <div class="history-item-date">${date}</div>
          </div>
          <div class="history-item-action" aria-hidden="true">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      `;
    });
    html += '</div>';
    historyContainer.innerHTML = html;

    // Tambahkan event listener untuk setiap item
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', async () => {
        const docId = item.dataset.id;
        const docRef = db.collection('users').doc(user.uid).collection('analyses').doc(docId);
        const docSnap = await docRef.get();

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Simpan data ke localStorage agar bisa dibaca oleh halaman utama
          localStorage.setItem('savedAnalysis', JSON.stringify({ analysis: data.analysis, profile: data.profile }));
          // Arahkan ke halaman utama
          window.location.href = '/index.html';
        } else {
          alert('Gagal memuat data. Riwayat tidak ditemukan.');
        }
      });
    });

  } catch (error) {
    console.error("Gagal memuat riwayat:", error);
    historyContainer.innerHTML = '<p style="text-align:center; color: var(--danger);">Terjadi kesalahan saat mengambil data dari server.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    const adminNav = document.getElementById('admin-nav-link');

    if (user) {
      // Cek role pengguna untuk menampilkan link admin
      db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists && doc.data().role === 'admin') {
          if (adminNav) {
            adminNav.style.display = 'flex';
          }
        }
      }).catch(err => {
        console.error("Gagal memeriksa role pengguna:", err);
      });

      loadHistory(user);
    } else {
      historyContainer.innerHTML = `
        <div style="text-align:center; padding: 20px; background: var(--glass); border-radius: 12px;">
          <p>Silakan <a href="/index.html" style="color: var(--accent);">login</a> terlebih dahulu untuk melihat riwayat analisis Anda.</p>
        </div>
      `;
      if (adminNav) {
        adminNav.style.display = 'none';
      }
    }
  });
});