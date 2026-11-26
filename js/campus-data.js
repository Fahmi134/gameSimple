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
    { id: "glasses", label: "Kacamata" },
    { id: "fox", label: "🦊 Kostum Rubah" },
    { id: "cat", label: "🐱 Kostum Kucing" },
    { id: "panda", label: "🐼 Kostum Panda" },
    { id: "bunny", label: "🐰 Kostum Kelinci" }
  ];

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
      hasInterior: true,
      wallColor: "#ffedd5",
      sideColor: "#fed7aa",
      roofColor: "#ea580c",
      trimColor: "#facc15",
      spawn: { x: 21.8, y: 28.2 },
      description:
        "Spot favorit mahasiswa untuk ngopi, makan siang, dan ngobrol santai lintas jurusan. Masuk ke dalam untuk memesan & makan!",
      tags: ["Bisa Dimasuki", "Soto Banjar & Kopi", "Meja Makan"]
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

  const ROADS = [
    { x: 20.5, y: 16.5, w: 3, h: 26 },
    { x: 5, y: 17, w: 34, h: 2.6 },
    { x: 5, y: 27.5, w: 34, h: 2.5 },
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

  // Canteen Interior Data (16x14 room)
  const CANTEEN_INTERIOR = {
    width: 16,
    height: 14,
    spawn: { x: 8, y: 11.6 },
    exitZone: { x: 8, y: 13.1, radius: 1.4 },
    counters: [
      { id: "stall-1", x: 2, y: 2, w: 5.2, h: 1.5, label: "WARUNG SOTO & NASI", color: "#ea580c" },
      { id: "stall-2", x: 8.8, y: 2, w: 5.2, h: 1.5, label: "POJOK KOPI & CEMILAN", color: "#0f766e" }
    ],
    tables: [
      { id: "tbl-1", x: 3.5, y: 6.5, w: 2.2, h: 1.5, dishEmoji: "🍲", dishName: "Soto Banjar" },
      { id: "tbl-2", x: 10.3, y: 6.5, w: 2.2, h: 1.5, dishEmoji: "🧋", dishName: "Kopi & Es Teh" },
      { id: "tbl-3", x: 3.5, y: 9.8, w: 2.2, h: 1.5, dishEmoji: "🍛", dishName: "Nasi Goreng" },
      { id: "tbl-4", x: 10.3, y: 9.8, w: 2.2, h: 1.5, dishEmoji: "🍢", dishName: "Pentol & Gorengan" }
    ],
    foodItems: [
      {
        id: "soto_banjar",
        name: "Soto Banjar Spesial",
        emoji: "🍲",
        energy: 30,
        spot: { x: 4.6, y: 4.5 },
        stallName: "Warung Soto Ibu Ani",
        desc: "Kuah rempah hangat dengan suwiran ayam, ketupat, dan perkedel khas Kalimantan Selatan.",
        reactions: [
          "Nyamm! Kuah Soto Banjar-nya hangat dan gurih banget 😋",
          "Enak pol! Langsung berasa tenaga balik lagi buat kuliah!"
        ]
      },
      {
        id: "nasi_goreng",
        name: "Nasi Goreng Kampus",
        emoji: "🍛",
        energy: 35,
        spot: { x: 4.6, y: 8.7 },
        stallName: "Meja Makan Barat",
        desc: "Nasi goreng spesial porsi mahasiswa lengkap dengan telur mata sapi dan kerupuk.",
        reactions: [
          "Mantap! Porsi kenyang buat lanjut praktikum di lab 😋",
          "Nasi goreng kantin Politala emang gak pernah gagal!"
        ]
      },
      {
        id: "kopi_esteh",
        name: "Kopi Susu & Es Teh Manis",
        emoji: "🧋",
        energy: 20,
        spot: { x: 11.4, y: 4.5 },
        stallName: "Pojok Kopi & Minuman",
        desc: "Es kopi susu gula aren segar & es teh manis dingin untuk teman ngoding atau nongkrong.",
        reactions: [
          "Sluurp! Segerrr banget, mata langsung melek lagi 🧋✨",
          "Kopi susunya pas banget buat nemenin nugas!"
        ]
      },
      {
        id: "pentol_gorengan",
        name: "Pentol & Gorengan Hangat",
        emoji: "🍢",
        energy: 15,
        spot: { x: 11.4, y: 8.7 },
        stallName: "Meja Cemilan Timur",
        desc: "Pentol kuah sambal kacang dan tahu goreng hangat untuk cemilan santai bareng teman.",
        reactions: [
          "Nyam nyam! Pentolnya kenyal, sambalnya nampol 🍢",
          "Enak banget buat ngemil sambil ngobrol di kantin!"
        ]
      }
    ],
    npcs: [
      {
        id: "npc-bu-ani",
        name: "Bu_Ani_Kantin",
        prodi: "Penjaga Kantin Politala",
        badge: "👩‍🍳 KANTIN",
        color: "#ea580c",
        style: "hijab",
        home: { x: 7.9, y: 4.2 },
        patrol: [
          { x: 7.9, y: 4.2 },
          { x: 5.5, y: 4.2 },
          { x: 10.2, y: 4.2 }
        ],
        phrases: [
          "Selamat datang di Kantin Politala! Silakan pilih makanan hangat di meja atau konter ya.",
          "Ada Soto Banjar, Nasi Goreng, Pentol, dan Kopi Susu segar!",
          "Dekati makanan atau klik mejanya lalu tekan [E] untuk langsung makan!"
        ]
      },
      {
        id: "furry-kantin-cat",
        name: "Milo_Kucing",
        prodi: "Maskot Furry • Penggemar Soto",
        badge: "🐱 FURRY",
        color: "#ec4899",
        style: "cat",
        isFurry: true,
        home: { x: 8, y: 8.2 },
        patrol: [
          { x: 8, y: 8.2 },
          { x: 6.4, y: 7.5 },
          { x: 9.6, y: 7.5 }
        ],
        phrases: [
          "Meow~ Bau Soto Banjar-nya bikin ngiler banget nih!",
          "Yuk makan bareng di Kantin Politala, tinggal tekan [E] di dekat makanan!",
          "Purr... Habis makan jangan lupa cobain emote 💃 atau ☕!"
        ]
      }
    ]
  };

  const NPCS = [
    {
      id: "furry-fox",
      name: "Mochi_Rubah",
      prodi: "Maskot Furry • Rubah",
      badge: "🦊 FURRY",
      color: "#f97316",
      style: "fox",
      isFurry: true,
      home: { x: 20.3, y: 35.8 },
      patrol: [
        { x: 20.3, y: 35.8 },
        { x: 23.6, y: 35.8 },
        { x: 22, y: 37.2 }
      ],
      phrases: [
        "Yip! Aku Mochi si Rubah! Klik aku atau tekan [F] buat ambil quest!",
        "Udah cobain masuk ke Kantin Politala belum? Di dalam ada makanan yang bisa dimakan lho!",
        "Selamat datang di Politala! Jangan lupa joget bareng pake tombol 💃!"
      ]
    },
    {
      id: "furry-cat",
      name: "Boba_Kucing",
      prodi: "Maskot Furry • Kucing",
      badge: "🐱 FURRY",
      color: "#a855f7",
      style: "cat",
      isFurry: true,
      home: { x: 20.5, y: 28.6 },
      patrol: [
        { x: 20.5, y: 28.6 },
        { x: 24.2, y: 28.4 },
        { x: 22.3, y: 29.3 }
      ],
      phrases: [
        "Meow~ Di dalam Kantin Politala ada Soto Banjar sama Kopi Susu! Ayo masuk!",
        "Purr... Klik gedung Kantin atau tekan [E] buat masuk ruangan kantin!",
        "Meow! Yuk main tebak kata atau ambil quest bareng Boba!"
      ]
    },
    {
      id: "furry-panda",
      name: "Pochi_Panda",
      prodi: "Maskot Furry • Panda",
      badge: "🐼 FURRY",
      color: "#334155",
      style: "panda",
      isFurry: true,
      home: { x: 19.2, y: 20.8 },
      patrol: [
        { x: 19.2, y: 20.8 },
        { x: 24.5, y: 20.8 },
        { x: 22, y: 21.8 }
      ],
      phrases: [
        "Halo! Aku Pochi si Panda di Plaza Air Mancur 🐼",
        "Butuh tantangan seru? Tekan [F] buat ambil quest random!",
        "Jangan lupa pose foto 📸 di depan Rektorat ya!"
      ]
    },
    {
      id: "furry-bunny",
      name: "Kiko_Kelinci",
      prodi: "Maskot Furry • Kelinci",
      badge: "🐰 FURRY",
      color: "#0ea5e9",
      style: "bunny",
      isFurry: true,
      home: { x: 12.6, y: 36.8 },
      patrol: [
        { x: 12.6, y: 36.8 },
        { x: 16.5, y: 37.5 },
        { x: 11.2, y: 37.5 }
      ],
      phrases: [
        "Hop hop! Aku Kiko si Kelinci dekat Masjid & Perpus 🐰",
        "Yuk kumpulin Koin Kampus dari quest random, tebak kata & jajan di kantin!",
        "Semangat kuliahnya teman-teman Politala!"
      ]
    },
    {
      id: "npc-ti",
      name: "Dika_TI",
      prodi: "D3 Teknologi Informasi",
      badge: "MAHASISWA",
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
        "Tekan [F] kalau mau ambil quest atau main tebak kata IT!"
      ]
    },
    {
      id: "npc-agro",
      name: "Siti_Agro",
      prodi: "D3 Agroindustri",
      badge: "MAHASISWA",
      color: "#10b981",
      style: "hijab",
      home: { x: 25.5, y: 28.5 },
      patrol: [
        { x: 25.5, y: 28.5 },
        { x: 28.5, y: 27.8 },
        { x: 23.5, y: 27.6 }
      ],
      phrases: [
        "Abis praktikum di Lab Agro, sekarang mau masuk Kantin makan soto!",
        "Soto di dalam kantin Politala enak banget siang ini!",
        "Selamat datang di Kampus Politala Pelaihari!"
      ]
    },
    {
      id: "npc-otomotif",
      name: "Bagas_Oto",
      prodi: "D3 Teknologi Otomotif",
      badge: "MAHASISWA",
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
      badge: "MAHASISWA",
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
    }
  ];

  const QUEST_POOL = [
    {
      id: "eat_canteen",
      type: "eat",
      title: "Jajan di Kantin Politala",
      desc: "Masuk ke dalam ruangan Kantin Politala dan santap 1 makanan atau minuman!",
      reward: 35
    },
    {
      id: "visit_gti",
      type: "visit",
      targetBuildingId: "gti",
      title: "Eksplorasi Gedung TI",
      desc: "Pergi ke depan Gedung Teknik Informatika (GTI) untuk cek lab komputer.",
      reward: 30
    },
    {
      id: "visit_kantin",
      type: "visit",
      targetBuildingId: "kantin",
      title: "Mampir ke Kantin Politala",
      desc: "Jalan menuju Kantin & Gazebo Nongkrong di tengah kampus.",
      reward: 25
    },
    {
      id: "visit_perpus",
      type: "visit",
      targetBuildingId: "perpus",
      title: "Kunjungan Literasi",
      desc: "Kunjungi Perpustakaan & Pusat Bahasa di sisi barat kampus.",
      reward: 30
    },
    {
      id: "visit_masjid",
      type: "visit",
      targetBuildingId: "masjid",
      title: "Singgah di Masjid Kampus",
      desc: "Kunjungi area Masjid Kampus Politala di sisi barat daya.",
      reward: 30
    },
    {
      id: "visit_agro",
      type: "visit",
      targetBuildingId: "agro",
      title: "Cek Lab Agroindustri",
      desc: "Kunjungi Gedung Lab Agroindustri di sebelah timur.",
      reward: 30
    },
    {
      id: "emote_dance",
      type: "emote",
      targetEmote: "💃",
      title: "Joget Kampus!",
      desc: "Ekspresikan dirimu dengan memakai emote Joget (💃) atau tombol [2].",
      reward: 25
    },
    {
      id: "emote_photo",
      type: "emote",
      targetEmote: "📸",
      title: "Foto Kenangan Kampus",
      desc: "Ambil pose foto dengan menekan emote Kamera (📸) atau tombol [5].",
      reward: 25
    },
    {
      id: "social_chat",
      type: "chat",
      title: "Sapa Warga Kampus",
      desc: "Kirim minimal 1 pesan di kolom Obrolan Kampus untuk menyapa yang lain.",
      reward: 25
    },
    {
      id: "word_guess_quest",
      type: "word_guess",
      title: "Tantangan Tebak Kata",
      desc: "Selesaikan 1 ronde mini-game Tebak Kata bersama NPC!",
      reward: 50
    }
  ];

  const TEBAK_KATA_BANK = [
    { word: "POLITALA", clue: "Singkatan nama Politeknik Negeri di Kabupaten Tanah Laut." },
    { word: "PELAIHARI", clue: "Ibu kota Kabupaten Tanah Laut, lokasi kampus berada." },
    { word: "REKTORAT", clue: "Gedung pusat administrasi dan pimpinan kampus." },
    { word: "KANTIN", clue: "Tempat favorit mahasiswa nongkrong, ngopi, dan makan soto." },
    { word: "ALGORITMA", clue: "Langkah logis pemrograman yang dipelajari anak TI." },
    { word: "AGROINDUSTRI", clue: "Jurusan pengolahan hasil pertanian di Politala." },
    { word: "OTOMOTIF", clue: "Program studi yang praktiknya di bengkel mesin & kendaraan." },
    { word: "PERPUSTAKAAN", clue: "Tempat tenang untuk membaca buku dan menyusun tugas akhir." },
    { word: "WIFI", clue: "Koneksi nirkabel penting di kampus buat ngerjain tugas." },
    { word: "RUBAH", clue: "Hewan berbulu oranye berekor lebat, kostumnya dipakai Mochi." },
    { word: "PANDA", clue: "Hewan hitam putih penggemar bambu, kostumnya dipakai Pochi." },
    { word: "KELINCI", clue: "Hewan bertelinga panjang yang suka melompat, kostum Kiko." },
    { word: "KUCING", clue: "Hewan lucu bersuara 'meow', kostumnya dipakai Boba & Milo." },
    { word: "SOTO", clue: "Kuliner berkuah khas Banjar yang bisa dimakan di Kantin Politala." }
  ];

  const SECRET_BERINGIN = {
    portal: {
      x: 3.8,
      y: 19.2,
      radius: 2.5,
      spawnOutside: { x: 5.5, y: 18.8 }
    },
    password: "hihu",
    roomName: "Museum Keluarga Beringin",
    monumentImageUrl: "js/monumen lho ya.jpeg",
    width: 16,
    height: 14,
    spawn: { x: 8, y: 11.4 },
    exitZone: { x: 8, y: 13.1, radius: 1.4 },
    monument: { x: 6.7, y: 2.8, w: 2.6, h: 2.1 },
    pedestals: [
      { id: "ped-1", x: 2.5, y: 6.5, w: 1.6, h: 1.4, icon: "📡", label: "Router Legendaris" },
      { id: "ped-2", x: 11.9, y: 6.5, w: 1.6, h: 1.4, icon: "📘", label: "Kitab Revisi" },
      { id: "ped-3", x: 2.5, y: 9.8, w: 1.6, h: 1.4, icon: "🗝️", label: "Kunci Bengkel Emas" },
      { id: "ped-4", x: 11.9, y: 9.8, w: 1.6, h: 1.4, icon: "🕯️", label: "Lilin Harapan IPK" }
    ],
    exhibits: [
      {
        id: "patung_utama",
        name: "Patung Penjaga Keluarga Beringin (Fiksi)",
        icon: "🗿",
        spot: { x: 8, y: 5.6 },
        rewardCoins: 20,
        desc: "Patung fiksi berjubah emas dan tudung hijau di bawah naungan Pohon Beringin Keramat. Simbol persaudaraan misterius mahasiswa Politala.",
        ritualLine: "Semua anggota Keluarga Beringin bersatu! Semoga Wi-Fi lancar & tugas selesai tepat waktu ✨"
      },
      {
        id: "router_pertama",
        name: "Artefak Router Wi-Fi Pertama",
        icon: "📡",
        spot: { x: 4.5, y: 7.2 },
        rewardCoins: 0,
        desc: "Konon artefak ini selalu memancarkan sinyal penuh 5 bar bagi mahasiswa yang rajin mencari ilmu di GTI.",
        ritualLine: "Sinyal Wi-Fi terasa semakin kuat di sekitar ruangan ini 📡"
      },
      {
        id: "kitab_revisi",
        name: "Kitab Revisi Abadi",
        icon: "📘",
        spot: { x: 11.4, y: 7.2 },
        rewardCoins: 0,
        desc: "Catatan kuno berisi kumpulan tips menghadapi sidang proyek akhir tanpa panik.",
        ritualLine: "Kamu membaca halaman pertama: 'Jangan lupa backup kode sebelum presentasi!' 📘"
      },
      {
        id: "kunci_emas",
        name: "Kunci Bengkel Emas",
        icon: "🗝️",
        spot: { x: 4.5, y: 10.5 },
        rewardCoins: 0,
        desc: "Kunci pas berkilau emas yang melambangkan ketangguhan mahasiswa teknik rekayasa & bengkel.",
        ritualLine: "Semangat praktik bengkel Politala menyala! 🗝️"
      },
      {
        id: "lilin_harapan",
        name: "Lilin Harapan IPK 4.0",
        icon: "🕯️",
        spot: { x: 11.4, y: 10.5 },
        rewardCoins: 0,
        desc: "Deretan lilin bercahaya tenang untuk merayakan persahabatan Keluarga Beringin.",
        ritualLine: "Cahaya lilin berkedip hangat... suasana museum terasa damai 🕯️"
      }
    ],
    npcs: [
      {
        id: "npc-tetua-beringin",
        name: "Tetua_Beringin",
        prodi: "Kurator Museum Keluarga Beringin",
        badge: "🌿 BERINGIN",
        color: "#059669",
        style: "hijab",
        home: { x: 6.2, y: 5.5 },
        patrol: [
          { x: 6.2, y: 5.5 },
          { x: 9.8, y: 5.5 },
          { x: 8, y: 6.6 }
        ],
        phrases: [
          "Selamat datang di Museum Rahasia Keluarga Beringin...",
          "Hanya pemegang sandi 'hihu' yang bisa melangkah masuk ke sini.",
          "Dekati Patung Penjaga Beringin di tengah lalu tekan [E] untuk melihat koleksinya!"
        ]
      },
      {
        id: "furry-owl-beringin",
        name: "Sora_Rubah_Penjaga",
        prodi: "Maskot Furry • Penjaga Museum",
        badge: "🦊 FURRY",
        color: "#f59e0b",
        style: "fox",
        isFurry: true,
        home: { x: 8, y: 8.6 },
        patrol: [
          { x: 8, y: 8.6 },
          { x: 6.2, y: 9.2 },
          { x: 9.8, y: 9.2 }
        ],
        phrases: [
          "Yip! Rahasia Keluarga Beringin aman bersama kami 🦊",
          "Setiap artefak di museum ini punya cerita unik kampus Politala!",
          "Jangan lupa foto 📸 di depan monumen utama sebelum keluar!"
        ]
      }
    ]
  };

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
    CANTEEN_INTERIOR,
    SECRET_BERINGIN,
    NPCS,
    QUEST_POOL,
    TEBAK_KATA_BANK
  };
})(window);
