// Script untuk menambahkan dummy hadiah dengan kategori
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dummyRewards = [
  // Digital Products (kategori_id: 1)
  {
    reward_name: 'Netflix Premium 1 Bulan',
    description: 'Akses Netflix Premium selama 1 bulan dengan kualitas 4K dan multi-device support',
    point_cost: 150,
    foto_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400',
    stock: 50,
    category_id: 1,
    required_privileges: null
  },
  {
    reward_name: 'Spotify Premium 3 Bulan',
    description: 'Nikmati musik tanpa iklan selama 3 bulan dengan Spotify Premium',
    point_cost: 200,
    foto_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    stock: 30,
    category_id: 1,
    required_privileges: null
  },
  {
    reward_name: 'Steam Wallet 100k',
    description: 'Top up Steam Wallet senilai Rp 100.000 untuk beli game favorit',
    point_cost: 1000,
    foto_url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400',
    stock: 20,
    category_id: 1,
    required_privileges: ['berkomunitasplus']
  },
  {
    reward_name: 'Adobe Creative Cloud 1 Bulan',
    description: 'Akses lengkap Adobe Creative Cloud selama 1 bulan',
    point_cost: 300,
    foto_url: 'https://images.unsplash.com/photo-1558655146-364adaf48c5e?w=400',
    stock: 15,
    category_id: 1,
    required_privileges: ['berkomunitasplus']
  },
  {
    reward_name: 'Microsoft Office 365 Personal',
    description: 'Lisensi Microsoft Office 365 Personal selama 1 tahun',
    point_cost: 800,
    foto_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    stock: 10,
    category_id: 1,
    required_privileges: null
  },
  {
    reward_name: 'Canva Pro 6 Bulan',
    description: 'Akses Canva Pro dengan fitur premium selama 6 bulan',
    point_cost: 250,
    foto_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
    stock: 25,
    category_id: 1,
    required_privileges: null
  },
  {
    reward_name: 'Zoom Pro 3 Bulan',
    description: 'Upgrade ke Zoom Pro untuk meeting unlimited selama 3 bulan',
    point_cost: 180,
    foto_url: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=400',
    stock: 40,
    category_id: 1,
    required_privileges: null
  },
  
  // Skincare Products (kategori_id: 4)
  {
    reward_name: 'Wardah Nature Daily Serum Vitamin C',
    description: 'Serum Vitamin C untuk kulit cerah dan sehat, 20ml',
    point_cost: 120,
    foto_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    stock: 35,
    category_id: 4,
    required_privileges: null
  },
  {
    reward_name: 'SKINTIFIC Niacinamide + Zinc Serum',
    description: 'Serum untuk mengontrol minyak dan mengecilkan pori, 20ml',
    point_cost: 100,
    foto_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
    stock: 45,
    category_id: 4,
    required_privileges: null
  },
  {
    reward_name: 'The Ordinary Hyaluronic Acid 2% + B5',
    description: 'Serum untuk melembapkan kulit dengan hyaluronic acid, 30ml',
    point_cost: 180,
    foto_url: 'https://images.unsplash.com/photo-1556229162-6f3df00b2a24?w=400',
    stock: 20,
    category_id: 4,
    required_privileges: ['berkomunitasplus']
  },
  {
    reward_name: 'Cetaphil Daily Facial Cleanser',
    description: 'Pembersih wajah gentle untuk semua jenis kulit, 250ml',
    point_cost: 80,
    foto_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    stock: 60,
    category_id: 4,
    required_privileges: null
  },
  {
    reward_name: 'Innisfree Green Tea Seed Serum',
    description: 'Serum dengan ekstrak green tea untuk kulit terhidrasi, 80ml',
    point_cost: 220,
    foto_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
    stock: 25,
    category_id: 4,
    required_privileges: ['berkomunitasplus']
  },
  {
    reward_name: 'Pixi Glow Tonic',
    description: 'Toner exfoliating dengan glycolic acid, 250ml',
    point_cost: 300,
    foto_url: 'https://images.unsplash.com/photo-1556228841-b0066d1d1220?w=400',
    stock: 15,
    category_id: 4,
    required_privileges: ['berkomunitasplus']
  },
  {
    reward_name: 'Garnier Micellar Water',
    description: 'Pembersih makeup dan wajah micellar water, 400ml',
    point_cost: 60,
    foto_url: 'https://images.unsplash.com/photo-1556228578-dd7f3c55b7dd?w=400',
    stock: 80,
    category_id: 4,
    required_privileges: null
  },
  
  // Merchandise (kategori_id: 5)
  {
    reward_name: 'T-Shirt Komunitas Premium',
    description: 'Kaos premium dengan logo komunitas, 100% katun combed 30s',
    point_cost: 150,
    foto_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    stock: 50,
    category_id: 5,
    required_privileges: null
  },
  {
    reward_name: 'Hoodie Komunitas Limited Edition',
    description: 'Hoodie eksklusif dengan desain terbatas, fleece premium',
    point_cost: 400,
    foto_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    stock: 20,
    category_id: 5,
    required_privileges: ['berkomunitasplus']
  },
  {
    reward_name: 'Mug Keramik Custom Logo',
    description: 'Mug keramik berkualitas tinggi dengan logo komunitas',
    point_cost: 80,
    foto_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',
    stock: 100,
    category_id: 5,
    required_privileges: null
  },
  {
    reward_name: 'Tote Bag Canvas Premium',
    description: 'Tas tote bag canvas tebal dengan sablon berkualitas',
    point_cost: 120,
    foto_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    stock: 75,
    category_id: 5,
    required_privileges: null
  },
  {
    reward_name: 'Pin Set Koleksi Komunitas',
    description: 'Set pin enamel koleksi terbatas komunitas (5 pin)',
    point_cost: 200,
    foto_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    stock: 30,
    category_id: 5,
    required_privileges: ['berkomunitasplus']
  },
  {
    reward_name: 'Sticker Pack Premium',
    description: 'Paket sticker waterproof premium komunitas (20 sticker)',
    point_cost: 50,
    foto_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
    stock: 150,
    category_id: 5,
    required_privileges: null
  }
];

async function addDummyRewards() {
  try {
    console.log('🎯 Menambahkan dummy hadiah...');
    
    // Pastikan kategori sudah ada
    const categories = await prisma.reward_categories.findMany();
    console.log(`📦 Ditemukan ${categories.length} kategori:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.id}: ${cat.name}`);
    });
    
    // Hapus reward lama jika ada
    const existingRewards = await prisma.rewards.findMany();
    if (existingRewards.length > 0) {
      console.log(`🗑️ Menghapus ${existingRewards.length} reward lama...`);
      await prisma.rewards.deleteMany({});
    }
    
    // Tambahkan reward baru
    console.log(`✨ Menambahkan ${dummyRewards.length} dummy rewards...`);
    
    for (const reward of dummyRewards) {
      await prisma.rewards.create({
        data: {
          ...reward,
          required_privileges: reward.required_privileges ? JSON.stringify(reward.required_privileges) : null
        }
      });
    }
    
    console.log('✅ Berhasil menambahkan semua dummy rewards!');
    
    // Tampilkan summary
    const summary = await prisma.rewards.groupBy({
      by: ['category_id'],
      _count: { id: true }
    });
    
    console.log('\n📊 Summary per kategori:');
    for (const item of summary) {
      const category = categories.find(c => c.id === item.category_id);
      console.log(`  - ${category?.name || 'Unknown'}: ${item._count.id} hadiah`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDummyRewards();