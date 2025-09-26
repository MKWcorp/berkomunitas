// Script langsung insert dummy rewards menggunakan raw SQL
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const dummyRewards = [
  // Digital Products
  { reward_name: 'Netflix Premium 1 Bulan', description: 'Akses Netflix Premium selama 1 bulan dengan kualitas 4K dan multi-device support', point_cost: 150, foto_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400', stock: 50 },
  { reward_name: 'Spotify Premium 3 Bulan', description: 'Nikmati musik tanpa iklan selama 3 bulan dengan Spotify Premium', point_cost: 200, foto_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', stock: 30 },
  { reward_name: 'Steam Wallet 100k', description: 'Top up Steam Wallet senilai Rp 100.000 untuk beli game favorit', point_cost: 1000, foto_url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', stock: 20 },
  { reward_name: 'Adobe Creative Cloud 1 Bulan', description: 'Akses lengkap Adobe Creative Cloud selama 1 bulan', point_cost: 300, foto_url: 'https://images.unsplash.com/photo-1558655146-364adaf48c5e?w=400', stock: 15 },
  { reward_name: 'Microsoft Office 365 Personal', description: 'Lisensi Microsoft Office 365 Personal selama 1 tahun', point_cost: 800, foto_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400', stock: 10 },
  { reward_name: 'Canva Pro 6 Bulan', description: 'Akses Canva Pro dengan fitur premium selama 6 bulan', point_cost: 250, foto_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400', stock: 25 },
  { reward_name: 'Zoom Pro 3 Bulan', description: 'Upgrade ke Zoom Pro untuk meeting unlimited selama 3 bulan', point_cost: 180, foto_url: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=400', stock: 40 },
  
  // Skincare Products
  { reward_name: 'Wardah Nature Daily Serum Vitamin C', description: 'Serum Vitamin C untuk kulit cerah dan sehat, 20ml', point_cost: 120, foto_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', stock: 35 },
  { reward_name: 'SKINTIFIC Niacinamide + Zinc Serum', description: 'Serum untuk mengontrol minyak dan mengecilkan pori, 20ml', point_cost: 100, foto_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400', stock: 45 },
  { reward_name: 'The Ordinary Hyaluronic Acid 2% + B5', description: 'Serum untuk melembapkan kulit dengan hyaluronic acid, 30ml', point_cost: 180, foto_url: 'https://images.unsplash.com/photo-1556229162-6f3df00b2a24?w=400', stock: 20 },
  { reward_name: 'Cetaphil Daily Facial Cleanser', description: 'Pembersih wajah gentle untuk semua jenis kulit, 250ml', point_cost: 80, foto_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', stock: 60 },
  { reward_name: 'Innisfree Green Tea Seed Serum', description: 'Serum dengan ekstrak green tea untuk kulit terhidrasi, 80ml', point_cost: 220, foto_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', stock: 25 },
  { reward_name: 'Pixi Glow Tonic', description: 'Toner exfoliating dengan glycolic acid, 250ml', point_cost: 300, foto_url: 'https://images.unsplash.com/photo-1556228841-b0066d1d1220?w=400', stock: 15 },
  { reward_name: 'Garnier Micellar Water', description: 'Pembersih makeup dan wajah micellar water, 400ml', point_cost: 60, foto_url: 'https://images.unsplash.com/photo-1556228578-dd7f3c55b7dd?w=400', stock: 80 },
  
  // Merchandise
  { reward_name: 'T-Shirt Komunitas Premium', description: 'Kaos premium dengan logo komunitas, 100% katun combed 30s', point_cost: 150, foto_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', stock: 50 },
  { reward_name: 'Hoodie Komunitas Limited Edition', description: 'Hoodie eksklusif dengan desain terbatas, fleece premium', point_cost: 400, foto_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', stock: 20 },
  { reward_name: 'Mug Keramik Custom Logo', description: 'Mug keramik berkualitas tinggi dengan logo komunitas', point_cost: 80, foto_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', stock: 100 },
  { reward_name: 'Tote Bag Canvas Premium', description: 'Tas tote bag canvas tebal dengan sablon berkualitas', point_cost: 120, foto_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', stock: 75 },
  { reward_name: 'Pin Set Koleksi Komunitas', description: 'Set pin enamel koleksi terbatas komunitas (5 pin)', point_cost: 200, foto_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', stock: 30 },
  { reward_name: 'Sticker Pack Premium', description: 'Paket sticker waterproof premium komunitas (20 sticker)', point_cost: 50, foto_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400', stock: 150 }
];

async function addDummyRewards() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 Menambahkan dummy hadiah...');
    
    // Hapus reward lama jika ada
    await client.query('DELETE FROM rewards');
    console.log('🗑️ Menghapus reward lama...');
    
    // Insert rewards baru
    for (const reward of dummyRewards) {
      const query = `
        INSERT INTO rewards (reward_name, description, point_cost, foto_url, stock)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(query, [
        reward.reward_name,
        reward.description,
        reward.point_cost,
        reward.foto_url,
        reward.stock
      ]);
    }
    
    console.log(`✅ Berhasil menambahkan ${dummyRewards.length} dummy rewards!`);
    
    // Cek hasil
    const result = await client.query('SELECT COUNT(*) FROM rewards');
    console.log(`📊 Total rewards di database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addDummyRewards();