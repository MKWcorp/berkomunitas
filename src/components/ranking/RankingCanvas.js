'use client';

import { useState, useEffect } from 'react';
import { RANKING_LEVELS, LEVEL_STATS } from '@/lib/rankingLevels';

// Function untuk generate deskripsi detail setiap level
const getDetailedDescription = (level) => {
  const descriptions = {
    // SURGA LEVELS
    'jannatul_firdaus': 'Jannatul Firdaus adalah surga tertinggi yang disebutkan dalam Al-Quran, tempat dimana para nabi, rasul, syuhada, dan orang-orang yang paling bertakwa akan berada. Ia adalah puncak dari segala kenikmatan abadi yang tak terbayangkan oleh akal manusia.',
    
    'al_maqamul_amin': 'Al-Maqamul Amin merupakan tempat yang aman dan mulia, dimana penghuninya terbebas dari segala bentuk ketakutan dan kesedihan. Ini adalah maqam (kedudukan) yang dijanjikan Allah untuk hamba-hamba-Nya yang beriman dan beramal shalih.',
    
    'jannatul_adn': 'Jannatul Adn adalah surga kediaman kekal yang disebutkan dalam Al-Quran sebagai tempat tinggal abadi bagi orang-orang beriman. Kata "Adn" berarti kediaman atau tempat tinggal yang permanen, menggambarkan kekekalan surga.',
    
    'darul_muqamah': 'Darul Muqamah adalah rumah kediaman yang tetap, tempat dimana tidak ada lagi kepergian atau kepindahan. Allah menjanjikan tempat ini sebagai anugerah bagi hamba-hamba-Nya yang bersyukur dan taat kepada-Nya.',
    
    'jannatun_naim': 'Jannatun Naim adalah surga yang penuh dengan berbagai kenikmatan dan kesenangan yang tidak pernah pudar. Setiap keinginan penghuni surga ini akan terpenuhi dengan sempurna, tanpa ada kekurangan sedikitpun.',
    
    'jannatul_mawa': 'Jannatul Mawa adalah surga tempat kembali dan berlindung, khususnya bagi mereka yang takut akan keagungan Allah. Ini adalah tempat berlindung yang aman bagi jiwa-jiwa yang bertakwa kepada Tuhannya.',
    
    'darussalam': 'Darussalam berarti negeri keselamatan, tempat yang bebas dari segala bentuk bahaya, penyakit, dan kematian. Allah sendiri disebut sebagai As-Salaam (Yang Maha Damai), dan inilah negeri kedamaian abadi-Nya.',

    // DUNIA LEVELS  
    'hakim_puncak_dunia': 'Hakim adalah gelar untuk pemimpin yang bijaksana dan adil, yang memegang tanggung jawab besar dalam mengatur urusan umat. Ini mewakili puncak pencapaian kepemimpinan di dunia dengan kebijaksanaan dan keadilan sebagai fondasinya.',
    
    'khalifah': 'Khalifah adalah wakil atau pengganti yang diamanahkan untuk memimpin dan mengatur bumi sesuai dengan kehendak Allah. Posisi ini membawa tanggung jawab besar untuk menegakkan keadilan dan kebaikan di muka bumi.',
    
    'ahli': 'Ahli merujuk pada orang yang memiliki pengetahuan mendalam dan keahlian dalam bidang tertentu. Dalam konteks ini, ia mewakili mereka yang berilmu dan menggunakan ilmunya untuk kebaikan umat dan kemaslahatan bersama.',
    
    'musafir': 'Musafir adalah pengembara atau orang yang dalam perjalanan. Dalam kehidupan spiritual, ini melambangkan jiwa yang terus mencari ilmu, hidayah, dan kedekatan kepada Allah dalam perjalanan hidupnya di dunia.',
    
    'insan_level_dasar': 'Insan adalah manusia dalam kondisi dasarnya, yang baru memulai perjalanan spiritual dan pencarian makna hidup. Ini adalah titik awal dimana setiap manusia memiliki potensi untuk naik ke level yang lebih tinggi.',

    // NERAKA LEVELS
    'hawiyah_gerbang_keluar': 'Hawiyah dalam Al-Quran digambarkan sebagai jurang yang dalam. Namun di sini ia diposisikan sebagai gerbang keluar, melambangkan bahwa bahkan dari kedalaman terdalam, masih ada jalan untuk bangkit dan memperbaiki diri.',
    
    'sair': 'Sair adalah api yang menyala-nyala, yang dalam konteks ini menjadi pengingat akan pentingnya menjaga diri dari perbuatan yang dapat merusak jiwa. Ini adalah peringatan untuk senantiasa bertaubat dan kembali kepada jalan yang benar.',
    
    'jahim': 'Jahim adalah api yang sangat panas yang disebutkan dalam Al-Quran. Dalam konteks motivasional ini, ia mengingatkan kita akan pentingnya melakukan amal baik dan menjauhi perbuatan yang dapat merugikan diri sendiri dan orang lain.',
    
    'hutamah': 'Hutamah berarti "yang menghancurkan" dalam bahasa Arab. Namun kehancuran juga bisa menjadi awal dari pembangunan yang baru. Level ini mengajarkan pentingnya introspeksi dan kemauan untuk berubah menjadi lebih baik.',
    
    'saqar': 'Saqar adalah nama salah satu tingkat dalam neraka yang disebutkan dalam Al-Quran. Dalam konteks motivasional, ia mengingatkan bahwa setiap orang memiliki kesempatan untuk memperbaiki diri dan tidak boleh putus asa.',
    
    'laza': 'Laza adalah api yang menjilat dan membakar. Namun seperti api yang memurnikan logam, pengalaman sulit dalam hidup juga bisa memurnikan jiwa dan membuatnya lebih kuat untuk menghadapi tantangan selanjutnya.',
    
    'jahannam': 'Jahannam adalah tingkat terendah yang disebutkan dalam Al-Quran, namun ini bukan akhir dari segalanya. Setiap perjalanan dimulai dari langkah pertama, dan dari titik terendah inilah seseorang bisa memulai pendakian menuju pencapaian yang lebih tinggi.'
  };

  return descriptions[level.id] || level.description;
};

const RankingCanvas = ({ users = [], currentUserId, currentUsername, onUserClick }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth appearance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Memuat Sistem Ranking...</p>
          <p className="text-sm text-gray-500">🕌 7 Surga • 🌍 5 Dunia • 🔥 7 Neraka</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Container dengan mobile-first responsive design */}
      <div 
        className="relative mx-auto bg-gray-50"
        style={{ 
          width: '1123px', // Fixed width for consistent layout
          minWidth: '1123px', // Ensure minimum width
          height: `${LEVEL_STATS.canvas_height}px`,
          backgroundImage: `url('/background_7_5_7.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Level Indicators - Centered labels */}
        {RANKING_LEVELS.map((level) => (
          <div
            key={level.id}
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${level.position.top}px`,
              height: `${level.position.height}px`,
            }}
          >
            {/* Level Label - Centered with Rounded Styling */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="bg-black/85 text-white px-8 py-6 rounded-3xl shadow-2xl backdrop-blur-md border border-white/20">
                <div className="flex flex-col items-center space-y-3">
                  <span className={`text-2xl ${
                    level.category === 'surga' ? 'text-yellow-300' :
                    level.category === 'dunia' ? 'text-blue-300' : 'text-red-300'
                  }`}>
                    {level.category === 'surga' ? '🌟' : 
                     level.category === 'dunia' ? '🌍' : '🔥'}
                  </span>
                  <div className="text-2xl font-bold text-white">
                    {level.name}
                  </div>
                  <div className="text-lg font-extrabold text-yellow-400 bg-yellow-400/10 px-4 py-1 rounded-full">
                    ({level.minLoyalty.toLocaleString()} Loyalty)
                  </div>
                  <div className="text-sm font-light text-gray-300 max-w-sm text-center leading-relaxed bg-white/5 px-4 py-2 rounded-2xl">
                    {getDetailedDescription(level)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* User Avatars Container */}
        <div className="absolute inset-0">
          {users.map((user) => {
            // Better current user detection
            const isCurrentUser = user.clerk_id === currentUserId || 
                                 user.username === currentUsername ||
                                 user.id === currentUserId;
            
            return (
              <UserAvatar
                key={user.id}
                user={user}
                isCurrentUser={isCurrentUser}
                onClick={() => onUserClick(user)}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

import UserAvatar from './UserAvatar';

export default RankingCanvas;
