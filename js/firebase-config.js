(function (global) {
  "use strict";

  // Isi firebaseConfig di bawah ini dengan konfigurasi proyek Firebase Anda
  // (Firebase Console -> Project Settings -> Your Apps -> Web App)
  // Setelah diisi dengan nilai asli (bukan YOUR_*), mode mabar online otomatis aktif!
  global.POLITALA_FIREBASE_CONFIG = {
    defaultRoom: "kampus-utama",
    firebaseConfig: {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    }
  };
})(window);
