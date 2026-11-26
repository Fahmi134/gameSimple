# Politala Social World (2.5D Campus Virtual)

Game sosial **2.5D Isometrik** bertema kampus **Politeknik Negeri Tanah Laut (Politala)** yang bisa di-host gratis di **GitHub Pages** dan mendukung **mabar online (20+ orang)** melalui **Firebase Realtime Database**.

## Fitur Utama
- **Halaman Login & Komunitas IG:** Input username, pilih Program Studi Politala, pilih warna jaket almamater & gaya karakter, serta tautan Instagram `@tambahkan_ketenangann` (konfirmasi mandiri karena keterbatasan API resmi Instagram).
- **Mabar Online via Firebase Realtime Database:** Sinkronisasi posisi avatar (ter-interpolasi halus), emote, balon chat, dan *auto-cleanup* (`onDisconnect`) saat pemain menutup browser. Gratis hingga 100 koneksi bersamaan di Firebase Spark Plan!
- **Fallback Mode Lokal Otomatis:** Jika `js/firebase-config.js` belum diisi, game tetap berjalan normal dan bisa tes multiplayer lokal antar tab browser (`BroadcastChannel`).
- **Multi-Room Support:** Tambahkan `?room=nama-room` di URL (contoh: `?room=anak-ti`) jika ingin membuat ruang terpisah.
- **Peta Kampus Politala 2.5D:** Gerbang Utama Politala, Gedung Rektorat, GKT Arsyad al-Banjari, GTI, Perpustakaan, Kantin & Gazebo, Lab Agroindustri, Bengkel Otomotif/Sipil/Alat Berat, Masjid Kampus, Plaza Air Mancur, dan Lapangan Olahraga.

---

## Panduan Mengaktifkan Mabar Online + Host di GitHub Pages

### 1. Buat Project Firebase (Gratis)
1. Buka [Firebase Console](https://console.firebase.google.com/) → klik **Create a project**.
2. Masuk ke menu **Build → Authentication → Get Started → Sign-in method**, lalu aktifkan **Anonymous** (*Enable*).
3. Masuk ke menu **Build → Realtime Database → Create Database**:
   - Pilih lokasi terdekat (misal **Singapore / `asia-southeast1`**).
   - Pilih mode awal, lalu buka tab **Rules** dan tempel isi file `database.rules.json` dari folder proyek ini → klik **Publish**.
4. Masuk ke **Project Settings (ikon roda gigi) → Your apps → Web (`</>`)**, daftarkan aplikasi web, lalu salin objek `firebaseConfig`.
5. Tempel nilai `firebaseConfig` tersebut ke dalam file `js/firebase-config.js` (menggantikan placeholder `YOUR_*`).

### 2. Upload ke GitHub Pages
1. Buat repository baru di GitHub (misal `politala-social-world`) dan upload seluruh isi folder ini.
2. Buka **Settings → Pages** di repository GitHub Anda.
3. Pada **Source**, pilih branch `main` (folder `/root`) → klik **Save**.
4. **Penting (Keamanan Domain Firebase):** Di Firebase Console → **Authentication → Settings → Authorized domains**, pastikan domain GitHub Pages Anda (misal `username.github.io`) sudah terdaftar di daftar *Authorized domains*.
5. Bagikan link `https://username.github.io/politala-social-world/` ke teman-teman Politala untuk langsung mabar!
