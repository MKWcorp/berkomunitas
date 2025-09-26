// Script untuk menambahkan dummy hadiah melalui API
const dummyRewards = [
  // Digital Products
  { 
    reward_name: 'Netflix Premium 1 Bulan', 
    description: 'Akses Netflix Premium selama 1 bulan dengan kualitas 4K dan multi-device support', 
    point_cost: 150, 
    foto_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400', 
    stock: 50,
    category_id: 1 
  },
  { 
    reward_name: 'Spotify Premium 3 Bulan', 
    description: 'Nikmati musik tanpa iklan selama 3 bulan dengan Spotify Premium', 
    point_cost: 200, 
    foto_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', 
    stock: 30,
    category_id: 1 
  },
  { 
    reward_name: 'Steam Wallet 100k', 
    description: 'Top up Steam Wallet senilai Rp 100.000 untuk beli game favorit', 
    point_cost: 1000, 
    foto_url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', 
    stock: 20,
    category_id: 1,
    required_privilege: 'berkomunitasplus'
  },
  { 
    reward_name: 'Adobe Creative Cloud 1 Bulan', 
    description: 'Akses lengkap Adobe Creative Cloud selama 1 bulan', 
    point_cost: 300, 
    foto_url: 'https://images.unsplash.com/photo-1558655146-364adaf48c5e?w=400', 
    stock: 15,
    category_id: 1,
    required_privilege: 'berkomunitasplus'
  },
  
  // Skincare Products (kategori 4)
  { 
    reward_name: 'Wardah Nature Daily Serum Vitamin C', 
    description: 'Serum Vitamin C untuk kulit cerah dan sehat, 20ml', 
    point_cost: 120, 
    foto_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', 
    stock: 35,
    category_id: 4
  },
  { 
    reward_name: 'SKINTIFIC Niacinamide + Zinc Serum', 
    description: 'Serum untuk mengontrol minyak dan mengecilkan pori, 20ml', 
    point_cost: 100, 
    foto_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400', 
    stock: 45,
    category_id: 4
  },
  { 
    reward_name: 'The Ordinary Hyaluronic Acid 2% + B5', 
    description: 'Serum untuk melembapkan kulit dengan hyaluronic acid, 30ml', 
    point_cost: 180, 
    foto_url: 'https://images.unsplash.com/photo-1556229162-6f3df00b2a24?w=400', 
    stock: 20,
    category_id: 4,
    required_privilege: 'berkomunitasplus'
  },
  { 
    reward_name: 'Cetaphil Daily Facial Cleanser', 
    description: 'Pembersih wajah gentle untuk semua jenis kulit, 250ml', 
    point_cost: 80, 
    foto_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 
    stock: 60,
    category_id: 4
  },
  
  // Merchandise (kategori 5)
  { 
    reward_name: 'T-Shirt Komunitas Premium', 
    description: 'Kaos premium dengan logo komunitas, 100% katun combed 30s', 
    point_cost: 150, 
    foto_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 
    stock: 50,
    category_id: 5
  },
  { 
    reward_name: 'Hoodie Komunitas Limited Edition', 
    description: 'Hoodie eksklusif dengan desain terbatas, fleece premium', 
    point_cost: 400, 
    foto_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', 
    stock: 20,
    category_id: 5,
    required_privilege: 'berkomunitasplus'
  },
  { 
    reward_name: 'Mug Keramik Custom Logo', 
    description: 'Mug keramik berkualitas tinggi dengan logo komunitas', 
    point_cost: 80, 
    foto_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', 
    stock: 100,
    category_id: 5
  },
  { 
    reward_name: 'Tote Bag Canvas Premium', 
    description: 'Tas tote bag canvas tebal dengan sablon berkualitas', 
    point_cost: 120, 
    foto_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 
    stock: 75,
    category_id: 5
  },
];

async function addDummyRewardsViaAPI() {
  const baseUrl = 'http://localhost:3001'; // atau URL server yang sedang berjalan
  
  console.log('🎯 Menambahkan dummy hadiah via API...');
  
  try {
    for (const reward of dummyRewards) {
      console.log(`⚡ Menambahkan: ${reward.reward_name}`);
      
      const response = await fetch(`${baseUrl}/api/admin/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'admin@example.com' // Ganti dengan email admin yang valid
        },
        body: JSON.stringify(reward)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Berhasil: ${result.reward_name} (ID: ${result.id})`);
      } else {
        const error = await response.json();
        console.error(`❌ Gagal: ${reward.reward_name} - ${error.error}`);
      }
      
      // Delay 500ms untuk tidak membebani server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎉 Selesai menambahkan semua dummy rewards!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan jika dipanggil langsung
if (typeof window === 'undefined') {
  addDummyRewardsViaAPI();
}

// Export untuk digunakan di browser console
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addDummyRewardsViaAPI, dummyRewards };
} else if (typeof window !== 'undefined') {
  window.addDummyRewardsViaAPI = addDummyRewardsViaAPI;
  window.dummyRewards = dummyRewards;
  console.log('🚀 Script loaded! Jalankan addDummyRewardsViaAPI() di console untuk menambahkan dummy data.');
}