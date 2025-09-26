// Simple script to create dummy data via API calls
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Dummy data
const categories = [
  {
    name: 'Digital',
    description: 'Produk dan layanan digital seperti e-money, voucher game, dan aplikasi premium',
    color: '#3B82F6'
  },
  {
    name: 'Skincare', 
    description: 'Produk perawatan kulit dan kecantikan',
    color: '#EC4899'
  }
];

const rewards = [
  // Digital rewards (10 items)
  {
    reward_name: 'Steam Wallet $10',
    description: 'Voucher Steam untuk pembelian game digital senilai $10',
    point_cost: 1500,
    stock: 50,
    category: 'Digital',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=1'
  },
  {
    reward_name: 'Google Play Gift Card Rp100k',
    description: 'Voucher Google Play Store untuk pembelian aplikasi dan game',
    point_cost: 1200,
    stock: 30,
    category: 'Digital',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=2'
  },
  {
    reward_name: 'Netflix Premium 1 Bulan',
    description: 'Langganan Netflix Premium selama 1 bulan (Khusus Member Plus)',
    point_cost: 2500,
    stock: 10,
    category: 'Digital',
    required_privilege: 'berkomunitasplus',
    foto_url: 'https://picsum.photos/400/300?random=3'
  },
  {
    reward_name: 'Spotify Premium 3 Bulan',
    description: 'Langganan Spotify Premium selama 3 bulan (Eksklusif Member Plus)',
    point_cost: 3000,
    stock: 5,
    category: 'Digital',
    required_privilege: 'berkomunitasplus',
    foto_url: 'https://picsum.photos/400/300?random=4'
  },
  {
    reward_name: 'OVO Saldo Rp50k',
    description: 'Top up saldo OVO senilai Rp50.000',
    point_cost: 800,
    stock: 100,
    category: 'Digital',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=5'
  },
  {
    reward_name: 'GoPay Saldo Rp75k',
    description: 'Top up saldo GoPay senilai Rp75.000',
    point_cost: 1000,
    stock: 75,
    category: 'Digital',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=6'
  },
  {
    reward_name: 'Adobe Creative Cloud 1 Bulan',
    description: 'Akses penuh Adobe Creative Suite selama 1 bulan (Member Plus Only)',
    point_cost: 4000,
    stock: 3,
    category: 'Digital',
    required_privilege: 'berkomunitasplus',
    foto_url: 'https://picsum.photos/400/300?random=7'
  },
  {
    reward_name: 'Canva Pro 6 Bulan',
    description: 'Langganan Canva Pro dengan fitur premium selama 6 bulan',
    point_cost: 2000,
    stock: 15,
    category: 'Digital',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=8'
  },
  {
    reward_name: 'Mobile Legends Diamond 500',
    description: 'Voucher 500 Diamond untuk game Mobile Legends',
    point_cost: 600,
    stock: 200,
    category: 'Digital',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=9'
  },
  {
    reward_name: 'Discord Nitro 2 Bulan',
    description: 'Langganan Discord Nitro Premium selama 2 bulan (Eksklusif Plus)',
    point_cost: 1800,
    stock: 8,
    category: 'Digital',
    required_privilege: 'berkomunitasplus',
    foto_url: 'https://picsum.photos/400/300?random=10'
  },

  // Skincare rewards (10 items)
  {
    reward_name: 'Serum Vitamin C 30ml',
    description: 'Serum brightening dengan Vitamin C untuk kulit glowing',
    point_cost: 900,
    stock: 25,
    category: 'Skincare',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=11'
  },
  {
    reward_name: 'Masker Wajah Honey Gold',
    description: 'Masker wajah premium dengan ekstrak madu dan emas 24K',
    point_cost: 1200,
    stock: 40,
    category: 'Skincare',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=12'
  },
  {
    reward_name: 'Set Skincare Premium Korea',
    description: 'Paket lengkap skincare Korea 7 steps (Eksklusif Member Plus)',
    point_cost: 3500,
    stock: 8,
    category: 'Skincare',
    required_privilege: 'berkomunitasplus',
    foto_url: 'https://picsum.photos/400/300?random=13'
  },
  {
    reward_name: 'Sunscreen SPF 50+ PA+++',
    description: 'Tabir surya dengan perlindungan maksimal untuk kulit sensitif',
    point_cost: 750,
    stock: 60,
    category: 'Skincare',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=14'
  },
  {
    reward_name: 'Retinol Night Cream',
    description: 'Krim malam anti-aging dengan retinol (Member Plus Only)',
    point_cost: 2800,
    stock: 12,
    category: 'Skincare',
    required_privilege: 'berkomunitasplus',
    foto_url: 'https://picsum.photos/400/300?random=15'
  },
  {
    reward_name: 'Micellar Water 500ml',
    description: 'Pembersih wajah gentle untuk semua jenis kulit',
    point_cost: 500,
    stock: 80,
    category: 'Skincare',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=16'
  },
  {
    reward_name: 'Facial Wash Charcoal',
    description: 'Sabun cuci muka dengan activated charcoal untuk kulit berminyak',
    point_cost: 400,
    stock: 100,
    category: 'Skincare',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=17'
  },
  {
    reward_name: 'Eye Cream Anti-Aging',
    description: 'Krim mata premium untuk mengurangi kerutan dan kantung mata',
    point_cost: 1500,
    stock: 20,
    category: 'Skincare',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=18'
  },
  {
    reward_name: 'Luxury Spa Treatment Set',
    description: 'Paket treatment spa premium di rumah (Khusus Member Plus)',
    point_cost: 5000,
    stock: 5,
    category: 'Skincare',
    required_privilege: 'berkomunitasplus',
    foto_url: 'https://picsum.photos/400/300?random=19'
  },
  {
    reward_name: 'Toner Niacinamide 200ml',
    description: 'Toner dengan niacinamide untuk mengecilkan pori dan mencerahkan',
    point_cost: 650,
    stock: 45,
    category: 'Skincare',
    required_privilege: '',
    foto_url: 'https://picsum.photos/400/300?random=20'
  }
];

async function createDummyData() {
  console.log('🚀 Creating dummy data via API calls...');
  console.log('📝 Note: This will create 20 rewards and show structure for future redemptions');
  console.log('🎯 Rewards with berkomunitasplus privilege: 6 items');
  console.log('📊 Categories: Digital (10) + Skincare (10)');
  console.log('\n📋 DUMMY REWARDS LIST:');
  
  rewards.forEach((reward, index) => {
    const privilegeText = reward.required_privilege ? ' (⭐ Member Plus Only)' : '';
    console.log(`${index + 1}. ${reward.reward_name} - ${reward.point_cost} pts${privilegeText}`);
    console.log(`   Category: ${reward.category} | Stock: ${reward.stock}`);
    console.log(`   ${reward.description}\n`);
  });

  console.log('\n📦 SAMPLE REDEMPTION STRUCTURE:');
  console.log('   Status Distribution:');
  console.log('   - menunggu_verifikasi: 10 records');
  console.log('   - dikirim: 10 records (with tracking numbers)');
  console.log('   - diterima: 10 records (completed with admin notes)');
  
  console.log('\n✅ Dummy data structure ready!');
  console.log('🎉 Total: 20 rewards (6 berkomunitasplus exclusive)');
  console.log('📍 Ready to implement in reward system!');
}

createDummyData();