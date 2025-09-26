// 🕌 SISTEM RANKING BERDASARKAN KONSEP ISLAMI
// 7 Level Surga + 5 Level Dunia + 7 Level Neraka = 19 Level Total

export const RANKING_LEVELS = [
  // ========== 🌟 7 LEVEL SURGA (TOP RANKS) ==========
  {
    id: 'jannatul_firdaus',
    name: 'Jannatul Firdaus',
    nameArabic: 'جَنَّةُ الْفِرْدَوْس',
    category: 'surga',
    rank: 1,
    minLoyalty: 100000,
    position: { top: 0, height: 2828 },
    description: 'Surga tertinggi, tempat para nabi dan syuhada',
    narration: 'Masha Allah! Anda berada di puncak tertinggi surga, bersama para nabi dan orang-orang shalih.',
    color: '#FFD700', // Gold
    gradient: 'from-yellow-300 to-yellow-500'
  },
  {
    id: 'al_maqamul_amin',
    name: 'Al-Maqamul Amin',
    nameArabic: 'الْمَقَامُ الأَمِيْن',
    category: 'surga',
    rank: 2,
    minLoyalty: 96000,
    position: { top: 2828, height: 1632 },
    description: 'Tempat yang aman dan mulia',
    narration: 'Subhanallah! Anda berada di tempat yang sangat mulia dan aman.',
    color: '#E6E6FA', // Lavender
    gradient: 'from-purple-200 to-purple-400'
  },
  {
    id: 'jannatul_adn',
    name: "Jannatul 'Adn",
    nameArabic: 'جَنَّةُ عَدْن',
    category: 'surga',
    rank: 3,
    minLoyalty: 88000,
    position: { top: 4460, height: 1631 },
    description: 'Surga kediaman yang kekal',
    narration: 'Alhamdulillah! Anda berada di surga kediaman yang kekal abadi.',
    color: '#98FB98', // Pale Green
    gradient: 'from-green-200 to-green-400'
  },
  {
    id: 'darul_muqamah',
    name: 'Darul Muqamah',
    nameArabic: 'دَارُ الْمُقَامَة',
    category: 'surga',
    rank: 4,
    minLoyalty: 77000,
    position: { top: 6091, height: 1754 },
    description: 'Rumah tempat tinggal yang tetap',
    narration: 'Barakallahu fiik! Anda telah mencapai rumah tempat tinggal yang tetap.',
    color: '#87CEEB', // Sky Blue
    gradient: 'from-blue-200 to-blue-400'
  },
  {
    id: 'jannatun_naim',
    name: "Jannatun Na'im",
    nameArabic: 'جَنَّةُ النَّعِيْم',
    category: 'surga',
    rank: 5,
    minLoyalty: 67000,
    position: { top: 7845, height: 1226 },
    description: 'Surga penuh kenikmatan',
    narration: 'Allahumma barik! Anda berada di surga yang penuh dengan kenikmatan.',
    color: '#F0E68C', // Khaki
    gradient: 'from-yellow-200 to-yellow-400'
  },
  {
    id: 'jannatul_mawa',
    name: "Jannatul Ma'wa",
    nameArabic: 'جَنَّةُ الْمَأْوَى',
    category: 'surga',
    rank: 6,
    minLoyalty: 58000,
    position: { top: 9071, height: 1157 },
    description: 'Surga tempat bernaung',
    narration: 'Subhanallah! Anda telah mencapai surga tempat bernaung yang indah.',
    color: '#DDA0DD', // Plum
    gradient: 'from-pink-200 to-pink-400'
  },
  {
    id: 'darussalam',
    name: 'Darussalam',
    nameArabic: 'دَارُ السَّلاَم',
    category: 'surga',
    rank: 7,
    minLoyalty: 50000,
    position: { top: 10228, height: 1274 },
    description: 'Negeri yang penuh kedamaian',
    narration: 'Alhamdulillahi rabbil alamiin! Anda berada di negeri kedamaian.',
    color: '#90EE90', // Light Green
    gradient: 'from-emerald-200 to-emerald-400'
  },

  // ========== 🌍 5 LEVEL DUNIA (MIDDLE RANKS) ==========
  {
    id: 'hakim_puncak_dunia',
    name: 'Hakim (Puncak Dunia)',
    nameArabic: 'حَاكِم',
    category: 'dunia',
    rank: 8,
    minLoyalty: 45000,
    position: { top: 11502, height: 1157 },
    description: 'Pemimpin bijaksana di puncak dunia',
    narration: 'Masha Allah! Anda adalah seorang pemimpin yang bijaksana di puncak dunia.',
    color: '#FFB6C1', // Light Pink
    gradient: 'from-orange-200 to-orange-400'
  },
  {
    id: 'khalifah',
    name: 'Khalifah',
    nameArabic: 'خَلِيْفَة',
    category: 'dunia',
    rank: 9,
    minLoyalty: 37000,
    position: { top: 12659, height: 1247 },
    description: 'Pemimpin umat yang bertanggung jawab',
    narration: 'Barakallahu fiikum! Anda adalah khalifah yang bertanggung jawab atas umat.',
    color: '#F4A460', // Sandy Brown
    gradient: 'from-amber-200 to-amber-400'
  },
  {
    id: 'ahli',
    name: 'Ahli',
    nameArabic: 'أَهْل',
    category: 'dunia',
    rank: 10,
    minLoyalty: 25000,
    position: { top: 13906, height: 1168 },
    description: 'Orang yang memiliki keahlian dan ilmu',
    narration: 'Allahumma barik! Anda adalah ahli yang memiliki ilmu dan keahlian.',
    color: '#DEB887', // Burlywood
    gradient: 'from-yellow-100 to-yellow-300'
  },
  {
    id: 'musafir',
    name: 'Musafir',
    nameArabic: 'مُسَافِر',
    category: 'dunia',
    rank: 11,
    minLoyalty: 16000,
    position: { top: 15074, height: 938 },
    description: 'Pengembara yang mencari ilmu dan hidayah',
    narration: 'Semangat! Anda adalah musafir yang terus mencari ilmu dan hidayah.',
    color: '#CD853F', // Peru
    gradient: 'from-orange-100 to-orange-300'
  },
  {
    id: 'insan_level_dasar',
    name: 'Insan (Level Dasar Dunia)',
    nameArabic: 'إِنْسَان',
    category: 'dunia',
    rank: 12,
    minLoyalty: 10000,
    position: { top: 16012, height: 699 },
    description: 'Manusia biasa yang memulai perjalanan',
    narration: 'Alhamdulillah! Anda adalah insan yang baru memulai perjalanan spiritual.',
    color: '#BC8F8F', // Rosy Brown
    gradient: 'from-stone-200 to-stone-400'
  },

  // ========== 🔥 7 LEVEL NERAKA (LOWER RANKS) ==========
  {
    id: 'hawiyah_gerbang_keluar',
    name: 'Hawiyah (Gerbang Keluar)',
    nameArabic: 'هَاوِيَة',
    category: 'neraka',
    rank: 13,
    minLoyalty: 9500,
    position: { top: 16860, height: 1930 },
    description: 'Gerbang keluar menuju perbaikan diri',
    narration: 'Sabar! Ini adalah gerbang keluar, tingkatkan amal untuk naik level.',
    color: '#CD5C5C', // Indian Red
    gradient: 'from-red-200 to-red-300'
  },
  {
    id: 'sair',
    name: "Sa'ir",
    nameArabic: 'سَعِيْر',
    category: 'neraka',
    rank: 14,
    minLoyalty: 8500,
    position: { top: 18790, height: 1775 },
    description: 'Api yang menyala-nyala, peringatan untuk bertobat',
    narration: 'Taubatan nasuha! Tingkatkan amal ibadah untuk keluar dari sini.',
    color: '#DC143C', // Crimson
    gradient: 'from-red-300 to-red-400'
  },
  {
    id: 'jahim',
    name: 'Jahim',
    nameArabic: 'جَحِيْم',
    category: 'neraka',
    rank: 15,
    minLoyalty: 7000,
    position: { top: 20565, height: 1530 },
    description: 'Api yang sangat panas, motivasi untuk beramal',
    narration: 'Istighfar! Mari tingkatkan kontribusi positif untuk naik level.',
    color: '#B22222', // Fire Brick
    gradient: 'from-red-400 to-red-500'
  },
  {
    id: 'hutamah',
    name: 'Hutamah',
    nameArabic: 'حُطَمَة',
    category: 'neraka',
    rank: 16,
    minLoyalty: 5000,
    position: { top: 22095, height: 1530 },
    description: 'Tempat yang menghancurkan, saatnya bangkit',
    narration: 'Bangkit! Mulai kontribusi lebih aktif untuk naik ke level yang lebih baik.',
    color: '#8B0000', // Dark Red
    gradient: 'from-red-500 to-red-600'
  },
  {
    id: 'saqar',
    name: 'Saqar',
    nameArabic: 'سَقَر',
    category: 'neraka',
    rank: 17,
    minLoyalty: 3000,
    position: { top: 23625, height: 2234 },
    description: 'Api yang membakar kulit, motivasi berubah',
    narration: 'Semangat! Mulai aktif berkomentar dan berkontribusi untuk naik level.',
    color: '#800000', // Maroon
    gradient: 'from-red-600 to-red-700'
  },
  {
    id: 'laza',
    name: 'Laza',
    nameArabic: 'لَظَى',
    category: 'neraka',
    rank: 18,
    minLoyalty: 1500,
    position: { top: 25859, height: 1898 },
    description: 'Api yang menjilat, hampir mencapai dasar',
    narration: 'Jangan menyerah! Mulai berkontribusi untuk keluar dari level ini.',
    color: '#660000', // Dark Dark Red
    gradient: 'from-red-700 to-red-800'
  },
  {
    id: 'jahannam',
    name: 'Jahannam',
    nameArabic: 'جَهَنَّم',
    category: 'neraka',
    rank: 19,
    minLoyalty: 0,
    position: { top: 27859, height: 3221 },
    description: 'Level terendah, awal perjalanan menuju perbaikan',
    narration: 'Mulai dari sini! Setiap langkah kecil menuju kebaikan sangat berharga.',
    color: '#330000', // Very Dark Red
    gradient: 'from-red-800 to-red-900'
  }
];

// Helper functions
export const findUserLevel = (loyalty) => {
  // Cari level yang sesuai dengan loyalty user
  // Loop dari rank tertinggi (1) ke terendah (19) untuk menemukan level tertinggi yang bisa dicapai user
  for (let i = 0; i < RANKING_LEVELS.length; i++) {
    const level = RANKING_LEVELS[i];
    // Jika loyalty user >= minLoyalty level ini, maka user berada di level ini
    if (loyalty >= level.minLoyalty) {
      return level;
    }
  }
  // Fallback ke level terendah jika loyalty kurang dari semua level
  return RANKING_LEVELS[RANKING_LEVELS.length - 1];
};

export const getNextLevel = (currentLevel) => {
  const currentIndex = RANKING_LEVELS.findIndex(level => level.id === currentLevel.id);
  return currentIndex > 0 ? RANKING_LEVELS[currentIndex - 1] : null;
};

export const calculateLoyaltyNeeded = (userLoyalty, currentLevel) => {
  const nextLevel = getNextLevel(currentLevel);
  return nextLevel ? nextLevel.minLoyalty - userLoyalty : 0;
};

// Statistik level
export const LEVEL_STATS = {
  total_levels: RANKING_LEVELS.length,
  surga_levels: RANKING_LEVELS.filter(l => l.category === 'surga').length,
  dunia_levels: RANKING_LEVELS.filter(l => l.category === 'dunia').length,
  neraka_levels: RANKING_LEVELS.filter(l => l.category === 'neraka').length,
  max_loyalty: Math.max(...RANKING_LEVELS.map(l => l.minLoyalty)),
  canvas_height: 31080 // px dari figma
};
