(function (global) {
  "use strict";

  const MAP_WIDTH = 44;
  const MAP_HEIGHT = 44;

  const OUTFIT_COLORS = [
    { id: "emerald", name: "Hijau Politala", hex: "#10b981" },
    { id: "navy", name: "Biru Teknik", hex: "#3b82f6" },
    { id: "amber", name: "Emas Kampus", hex: "#f59e0b" },
    { id: "rose", name: "Merah Hima", hex: "#f43f5e" },
    { id: "violet", name: "Ungu Kreatif", hex: "#8b5cf6" },
    { id: "cyan", name: "Toska Agro", hex: "#06b6d4" }
  ];

  const AVATAR_STYLES = [
    { id: "casual", label: "Mahasiswa" },
    { id: "hijab", label: "Berhijab" },
    { id: "cap", label: "Topi Kampus" },
    { id: "glasses", label: "Kacamata" }
  ];

  // Authentic Politeknik Negeri Tanah Laut (Pelaihari) stylized landmarks
  const BUILDINGS = [
    {
      id: "rektorat",
      name: "Gedung Administrasi & Rektorat",
      shortName: "REKTORAT",
      category: "PUSAT",
      x: 18,
      y: 12,
      w: 8,
      h: 4.5,
      floors: 3,
      wallColor: "#e2e8f0",
      sideColor: "#cbd5e1",
      roofColor: "#0f766e",
      trimColor: "#f59e0b",
      spawn: { x: 22, y: 18.2 },
      description:
        "Pusat administrasi akademik, kemahasiswaan, dan layanan pimpinan Politeknik Negeri Tanah Laut di Jl. A. Yani Km. 06.",
      tags: ["Layanan Akademik", "Plaza Bendera", "Ruang Rapat"]
    },
    {
      id: "gkt",
      name: "Gedung Kuliah Terpadu (GKT)",
      shortName: "GKT ARSYAD AL-BANJARI",
      category: "KULIAH",
      x: 6,
      y: 10,
      w: 8.5,
      h: 5,
      floors: 4,
      wallColor: "#f1f5f9",
      sideColor: "#cbd5e1",
      roofColor: "#1d4ed8",
      trimColor: "#38bdf8",
      spawn: { x: 10.2, y: 16.5 },
      description:
        "Gedung Kuliah Terpadu Syekh Muhammad Arsyad al-Banjari — ruang kuliah modern dan aula utama kampus.",
      tags: ["Ruang Kuliah Bersama", "Aula Utama", "Proyektor & AC"]
    },
    {
      id: "gti",
      name: "Gedung Teknik Informatika (GTI)",
      shortName: "GTI",
      category: "IT & BISNIS",
      x: 30,
      y: 10,
      w: 8,
      h: 4.8,
      floors: 3,
      wallColor: "#e0f2fe",
      sideColor: "#bae6fd",
      roofColor: "#0369a1",
      trimColor: "#10b981",
      spawn: { x: 34, y: 16.4 },
      description:
        "Gedung Teknik Informatika Nadiem Anwar Makarim — markas mahasiswa TI, TRKJ, serta lab komputer dan jaringan.",
      tags: ["Lab Pemrograman", "Lab Jaringan", "Wi-Fi Kencang"]
    },
    {
      id: "perpus",
      name: "Perpustakaan & Pusat Bahasa",
      shortName: "PERPUSTAKAAN",
      category: "LITERASI",
      x: 7,
      y: 21,
      w: 6.5,
      h: 4.2,
      floors: 2,
      wallColor: "#fef3c7",
      sideColor: "#fde68a",
      roofColor: "#b45309",
      trimColor: "#f59e0b",
      spawn: { x: 10.2, y: 26.5 },
      description:
        "Tempat tenang untuk mengerjakan tugas akhir, membaca jurnal, dan diskusi kelompok mahasiswa Politala.",
      tags: ["Ruang Baca", "E-Library", "Zona Tenang"]
    },
    {
      id: "kantin",
      name: "Kantin & Gazebo Nongkrong",
      shortName: "KANTIN POLITALA",
      category: "SOSIAL",
      x: 18.5,
      y: 23,
      w: 6.5,
      h: 3.8,
      floors: 1,
      wallColor: "#ffedd5",
      sideColor: "#fed7aa",
      roofColor: "#ea580c",
      trimColor: "#facc15",
      spawn: { x: 21.8, y: 28.2 },
      description:
        "Spot favorit mahasiswa untuk ngopi, makan siang, dan ngobrol santai lintas jurusan setelah jam kuliah.",
      tags: ["Kopi & Soto Banjar", "Gazebo Wi-Fi", "Titik Kumpul"]
    },
    {
      id: "agro",
      name: "Gedung Lab Agroindustri",
      shortName: "LAB AGRO",
      category: "PERTANIAN",
      x: 31,
      y: 21,
      w: 7,
      h: 4.2,
      floors: 2,
      wallColor: "#dcfce7",
      sideColor: "#bbf7d0",
      roofColor: "#15803d",
      trimColor: "#4ade80",
      spawn: { x: 34.5, y: 26.6 },
      description:
        "Laboratorium jurusan Teknologi Industri Pertanian, Teknologi Pakan Ternak, dan Pengembangan Produk Agroindustri.",
      tags: ["Lab Pangan", "Uji Mutu", "Greenhouse"]
    },
    {
      id: "bengkel",
      name: "Bengkel Otomotif, Sipil & Alat Berat",
      shortName: "WORKSHOP TEKNIK",
      category: "REKAYASA",
      x: 30,
      y: 31,
      w: 8.5,
      h: 4.8,
      floors: 2,
      wallColor: "#e5e7eb",
      sideColor: "#d1d5db",
      roofColor: "#334155",
      trimColor: "#f97316",
      spawn: { x: 34.2, y: 37.2 },
      description:
        "Bengkel praktik terpadu untuk Teknologi Otomotif, Teknologi Sipil, Konstruksi Jalan & Jembatan, dan Alat Berat.",
      tags: ["Workshop Alat Berat", "Lab Uji Beton", "Bengkel Otomotif"]
    },
    {
      id: "masjid",
      name: "Masjid Kampus Politala",
      shortName: "MASJID KAMPUS",
      category: "IBADAH",
      x: 7,
      y: 31,
      w: 6,
      h: 4.5,
      floors: 2,
      wallColor: "#f8fafc",
      sideColor: "#e2e8f0",
      roofColor: "#047857",
      trimColor: "#fbbf24",
      isMosque: true,
      spawn: { x: 10, y: 36.8 },
      description:
        "Pusat ibadah dan kegiatan kerohanian mahasiswa serta sivitas akademika Politeknik Negeri Tanah Laut.",
      tags: ["Shalat Berjamaah", "Kajian Kampus", "Taman Teduh"]
    }
  ];

  // Non-blocking decorative / interactive outdoor zones
  const ZONES = [
    {
      id: "gerbang",
      name: "Gerbang Utama Politala",
      desc: "Jl. A. Yani Km. 06, Desa Panggung, Pelaihari",
      x: 22,
      y: 39.5,
      radius: 4.5,
      spawn: { x: 22, y: 38.2 }
    },
    {
      id: "plaza",
      name: "Plaza Taman & Air Mancur",
      desc: "Area tengah kampus untuk berfoto & berkumpul",
      x: 22,
      y: 19.5,
      radius: 3.8,
      spawn: { x: 22, y: 20.5 }
    },
    {
      id: "lapangan",
      name: "Lapangan Olahraga Politala",
      desc: "Lapangan basket & futsal mahasiswa",
      x: 22,
      y: 32.5,
      radius: 4.5,
      spawn: { x: 22, y: 32.5 }
    }
  ];

  // Roads (grid rectangles where pavement is drawn)
  const ROADS = [
    // Main vertical boulevard from front gate to Rektorat
    { x: 20.5, y: 16.5, w: 3, h: 26 },
    // Upper campus crossroad
    { x: 5, y: 17, w: 34, h: 2.6 },
    // Middle campus crossroad
    { x: 5, y: 27.5, w: 34, h: 2.5 },
    // Lower campus road
    { x: 5, y: 37, w: 34, h: 2.4 }
  ];

  const TREES = [
    { x: 4, y: 8 }, { x: 15.8, y: 10 }, { x: 27.8, y: 10 }, { x: 40, y: 9 },
    { x: 4, y: 16 }, { x: 15.8, y: 21 }, { x: 27.8, y: 21 }, { x: 40, y: 21 },
    { x: 4, y: 28 }, { x: 15.8, y: 31 }, { x: 27.8, y: 31 }, { x: 40, y: 31 },
    { x: 17.5, y: 39 }, { x: 26.5, y: 39 }, { x: 14, y: 39 }, { x: 30, y: 39 },
    { x: 4, y: 37 }, { x: 40, y: 38 }
  ];

  const BENCHES = [
    { x: 17.2, y: 20.2 },
    { x: 26.8, y: 20.2 },
    { x: 17.2, y: 26.4 },
    { x: 26.8, y: 26.4 }
  ];

  const LAMP_POSTS = [
    { x: 19.8, y: 17.2 }, { x: 24.2, y: 17.2 },
    { x: 19.8, y: 22.2 }, { x: 24.2, y: 22.2 },
    { x: 19.8, y: 28.2 }, { x: 24.2, y: 28.2 },
    { x: 19.8, y: 36.6 }, { x: 24.2, y: 36.6 },
    { x: 11.5, y: 16.8 }, { x: 32.5, y: 16.8 },
    { x: 11.5, y: 27.2 }, { x: 32.5, y: 27.2 }
  ];

  const NPCS = [
    {
      id: "npc-ti",
      name: "Dika_TI",
      prodi: "D3 Teknologi Informasi",
      color: "#3b82f6",
      style: "glasses",
      home: { x: 33.5, y: 17.6 },
      patrol: [
        { x: 33.5, y: 17.6 },
        { x: 29.5, y: 18.2 },
        { x: 35.5, y: 18.2 }
      ],
      phrases: [
        "Baru keluar dari Lab Jaringan GTI nih, Wi-Fi-nya ngebut!",
        "Eh, udah follow @tambahkan_ketenangann belum?",
        "Ada yang mau ngoding bareng di gazebo kantin?"
      ]
    },
    {
      id: "npc-agro",
      name: "Siti_Agro",
      prodi: "D3 Agroindustri",
      color: "#10b981",
      style: "hijab",
      home: { x: 22.4, y: 28.5 },
      patrol: [
        { x: 22.4, y: 28.5 },
        { x: 25.5, y: 28.5 },
        { x: 21.5, y: 26.8 }
      ],
      phrases: [
        "Abis praktikum di Lab Agro, sekarang istirahat dulu di Kantin.",
        "Soto di kantin Politala enak banget siang ini!",
        "Selamat datang di Kampus Politala Pelaihari!"
      ]
    },
    {
      id: "npc-otomotif",
      name: "Bagas_Oto",
      prodi: "D3 Teknologi Otomotif",
      color: "#f59e0b",
      style: "cap",
      home: { x: 32.8, y: 37.5 },
      patrol: [
        { x: 32.8, y: 37.5 },
        { x: 27.5, y: 37.8 },
        { x: 23.5, y: 34.5 }
      ],
      phrases: [
        "Lagi persiapan bengkel alat berat & otomotif sore ini!",
        "Habis ini main futsal di lapangan tengah yuk!",
        "Salam solidaritas anak Teknik Politala!"
      ]
    },
    {
      id: "npc-akuntansi",
      name: "Nadia_Akun",
      prodi: "D4 Akuntansi Perpajakan",
      color: "#8b5cf6",
      style: "hijab",
      home: { x: 11.2, y: 26.8 },
      patrol: [
        { x: 11.2, y: 26.8 },
        { x: 15.5, y: 27.8 },
        { x: 10.5, y: 18.2 }
      ],
      phrases: [
        "Perpustakaan Politala adem banget buat ngerjain laporan.",
        "Jangan lupa mampir ke Gedung GKT Arsyad al-Banjari!",
        "Senang bisa ketemu mahasiswa baru di sini 👋"
      ]
    },
    {
      id: "npc-sipil",
      name: "Fajar_Sipil",
      prodi: "D3 Teknologi Sipil",
      color: "#f43f5e",
      style: "casual",
      home: { x: 22, y: 21.2 },
      patrol: [
        { x: 22, y: 21.2 },
        { x: 18.5, y: 20.5 },
        { x: 25.5, y: 20.5 }
      ],
      phrases: [
        "Plaza Rektorat lagi ramai nih, pas banget buat foto bareng!",
        "Coba ganti waktu ke Senja atau Malam di kanan atas, keren lho!",
        "Halo! Klik gedung atau tekan E kalau mau lihat info kampus."
      ]
    }
  ];

  global.PolitalaData = {
    MAP_WIDTH,
    MAP_HEIGHT,
    OUTFIT_COLORS,
    AVATAR_STYLES,
    BUILDINGS,
    ZONES,
    ROADS,
    TREES,
    BENCHES,
    LAMP_POSTS,
    NPCS
  };
})(window);
