// ============================================================
// TOS v3.0 — Admin Panel Logic
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const adminContent = document.getElementById('admin-content');

/**
 * Memuat daftar pengguna dari Firestore.
 */
async function loadUsers() {
  try {
    const querySnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

    if (querySnapshot.empty) {
      adminContent.innerHTML = '<p>Belum ada pengguna terdaftar.</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach(doc => {
      const user = doc.data();
      const date = user.createdAt?.toDate().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      }) || 'N/A';

      html += `
        <div class="user-list-item">
          <div class="user-info">
            <span class="user-email">${user.email}</span>
            ${user.whatsapp ? `<span class="user-whatsapp"><i class="fa-brands fa-whatsapp"></i> ${user.whatsapp}</span>` : ''}
            <span class="user-date">Daftar: ${date}</span>
          </div>
          <label class="switch" title="Aktifkan/Nonaktifkan Pengguna">
            <input type="checkbox" class="user-toggle" data-uid="${doc.id}" ${user.isActive ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      `;
    });
    adminContent.innerHTML = html;

    // Tambahkan event listener untuk toggle
    document.querySelectorAll('.user-toggle').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const uid = e.target.dataset.uid;
        const isActive = e.target.checked;
        
        try {
          const userDoc = await db.collection('users').doc(uid).get();
          const userData = userDoc.data();
          const updateData = { isActive: isActive };

          // Jika pengguna diaktifkan dan belum punya kredit (untuk user lama), beri kredit.
          if (isActive && typeof userData.analysisCredits === 'undefined') {
            updateData.analysisCredits = 3; // Beri 3 kredit
          }
          await db.collection('users').doc(uid).update(updateData);
          console.log(`User ${uid} status changed to ${isActive}`);
        } catch (error) {
          console.error("Gagal update status user:", error);
          // Kembalikan toggle ke state sebelumnya jika gagal
          e.target.checked = !isActive;
        }
      });
    });

  } catch (error) {
    console.error("Gagal memuat pengguna:", error);
    adminContent.innerHTML = '<p style="color: var(--danger);">Gagal memuat data pengguna.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      // Cek apakah user adalah admin
      db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists && doc.data().role === 'admin') {
          loadUsers();
        } else {
          // Jika bukan admin, tendang ke halaman utama
          adminContent.innerHTML = '<p>Akses ditolak. Anda bukan admin.</p>';
          setTimeout(() => { window.location.href = '/index.html'; }, 2000);
        }
      });
    } else {
      // Jika tidak login, tendang ke halaman utama
      adminContent.innerHTML = `
        <div style="text-align:center; padding: 20px;">
          <p>Silakan <a href="/index.html" style="color: var(--accent);">login</a> sebagai admin.</p>
        </div>
      `;
    }
  });
});