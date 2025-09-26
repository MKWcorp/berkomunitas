// Script untuk mengubah persentase boost di kode
// CATATAN: Ini akan mengubah file kode, bukan database

const fs = require('fs');
const path = require('path');

async function updateBoostPercentage(newPercentage = 500) {
  try {
    const filePath = path.join(__dirname, 'src/hooks/useEventBoost.js');
    
    console.log(`🔄 Mengubah WEEKEND_BOOST percentage menjadi ${newPercentage}%...`);
    
    // Baca file useEventBoost.js
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Ganti boostPercentage untuk WEEKEND_BOOST
    const oldPattern = /WEEKEND_BOOST:\s*{[^}]*boostPercentage:\s*\d+/g;
    const newValue = content.replace(
      /(\s+boostPercentage:\s*)\d+/,
      `$1${newPercentage}`
    );
    
    // Tulis kembali file
    fs.writeFileSync(filePath, newValue, 'utf8');
    
    console.log(`✅ Berhasil mengubah boost percentage menjadi ${newPercentage}%`);
    console.log(`📝 File yang diubah: ${filePath}`);
    console.log(`⚠️  CATATAN: Anda perlu restart server development (npm run dev) untuk melihat perubahan`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Contoh penggunaan:
// node update-boost-percentage.js
updateBoostPercentage(500); // Mengubah menjadi 500% (5x lipat)
