const prisma = require('./src/utils/prisma.js').default;

async function createDummyData() {
  try {
    console.log('🚀 Starting dummy data creation...');

    // 1. Create reward categories
    console.log('📁 Creating reward categories...');
    const digitalCategory = await prisma.reward_categories.upsert({
      where: { name: 'Digital' },
      update: {},
      create: {
        name: 'Digital',
        description: 'Produk dan layanan digital seperti e-money, voucher game, dan aplikasi premium',
        color: '#3B82F6'
      }
    });

    const skincareCategory = await prisma.reward_categories.upsert({
      where: { name: 'Skincare' },
      update: {},
      create: {
        name: 'Skincare',
        description: 'Produk perawatan kulit dan kecantikan',
        color: '#EC4899'
      }
    });

    console.log('✅ Categories created:', digitalCategory.id, skincareCategory.id);

    // 2. Create 20 dummy rewards
    console.log('🎁 Creating 20 dummy rewards...');
    const rewards = [
      // Digital rewards (10 items)
      {
        reward_name: 'Steam Wallet $10',
        description: 'Voucher Steam untuk pembelian game digital senilai $10',
        point_cost: 1500,
        stock: 50,
        category_id: digitalCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=1'
      },
      {
        reward_name: 'Google Play Gift Card Rp100k',
        description: 'Voucher Google Play Store untuk pembelian aplikasi dan game',
        point_cost: 1200,
        stock: 30,
        category_id: digitalCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=2'
      },
      {
        reward_name: 'Netflix Premium 1 Bulan',
        description: 'Langganan Netflix Premium selama 1 bulan (Khusus Member Plus)',
        point_cost: 2500,
        stock: 10,
        category_id: digitalCategory.id,
        required_privilege: 'berkomunitasplus',
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=3'
      },
      {
        reward_name: 'Spotify Premium 3 Bulan',
        description: 'Langganan Spotify Premium selama 3 bulan (Eksklusif Member Plus)',
        point_cost: 3000,
        stock: 5,
        category_id: digitalCategory.id,
        required_privilege: 'berkomunitasplus',
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=4'
      },
      {
        reward_name: 'OVO Saldo Rp50k',
        description: 'Top up saldo OVO senilai Rp50.000',
        point_cost: 800,
        stock: 100,
        category_id: digitalCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=5'
      },
      {
        reward_name: 'GoPay Saldo Rp75k',
        description: 'Top up saldo GoPay senilai Rp75.000',
        point_cost: 1000,
        stock: 75,
        category_id: digitalCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=6'
      },
      {
        reward_name: 'Adobe Creative Cloud 1 Bulan',
        description: 'Akses penuh Adobe Creative Suite selama 1 bulan (Member Plus Only)',
        point_cost: 4000,
        stock: 3,
        category_id: digitalCategory.id,
        required_privilege: 'berkomunitasplus',
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=7'
      },
      {
        reward_name: 'Canva Pro 6 Bulan',
        description: 'Langganan Canva Pro dengan fitur premium selama 6 bulan',
        point_cost: 2000,
        stock: 15,
        category_id: digitalCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=8'
      },
      {
        reward_name: 'Mobile Legends Diamond 500',
        description: 'Voucher 500 Diamond untuk game Mobile Legends',
        point_cost: 600,
        stock: 200,
        category_id: digitalCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=9'
      },
      {
        reward_name: 'Discord Nitro 2 Bulan',
        description: 'Langganan Discord Nitro Premium selama 2 bulan (Eksklusif Plus)',
        point_cost: 1800,
        stock: 8,
        category_id: digitalCategory.id,
        required_privilege: 'berkomunitasplus',
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=10'
      },

      // Skincare rewards (10 items)
      {
        reward_name: 'Serum Vitamin C 30ml',
        description: 'Serum brightening dengan Vitamin C untuk kulit glowing',
        point_cost: 900,
        stock: 25,
        category_id: skincareCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=11'
      },
      {
        reward_name: 'Masker Wajah Honey Gold',
        description: 'Masker wajah premium dengan ekstrak madu dan emas 24K',
        point_cost: 1200,
        stock: 40,
        category_id: skincareCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=12'
      },
      {
        reward_name: 'Set Skincare Premium Korea',
        description: 'Paket lengkap skincare Korea 7 steps (Eksklusif Member Plus)',
        point_cost: 3500,
        stock: 8,
        category_id: skincareCategory.id,
        required_privilege: 'berkomunitasplus',
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=13'
      },
      {
        reward_name: 'Sunscreen SPF 50+ PA+++',
        description: 'Tabir surya dengan perlindungan maksimal untuk kulit sensitif',
        point_cost: 750,
        stock: 60,
        category_id: skincareCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=14'
      },
      {
        reward_name: 'Retinol Night Cream',
        description: 'Krim malam anti-aging dengan retinol (Member Plus Only)',
        point_cost: 2800,
        stock: 12,
        category_id: skincareCategory.id,
        required_privilege: 'berkomunitasplus',
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=15'
      },
      {
        reward_name: 'Micellar Water 500ml',
        description: 'Pembersih wajah gentle untuk semua jenis kulit',
        point_cost: 500,
        stock: 80,
        category_id: skincareCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=16'
      },
      {
        reward_name: 'Facial Wash Charcoal',
        description: 'Sabun cuci muka dengan activated charcoal untuk kulit berminyak',
        point_cost: 400,
        stock: 100,
        category_id: skincareCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=17'
      },
      {
        reward_name: 'Eye Cream Anti-Aging',
        description: 'Krim mata premium untuk mengurangi kerutan dan kantung mata',
        point_cost: 1500,
        stock: 20,
        category_id: skincareCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=18'
      },
      {
        reward_name: 'Luxury Spa Treatment Set',
        description: 'Paket treatment spa premium di rumah (Khusus Member Plus)',
        point_cost: 5000,
        stock: 5,
        category_id: skincareCategory.id,
        required_privilege: 'berkomunitasplus',
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=19'
      },
      {
        reward_name: 'Toner Niacinamide 200ml',
        description: 'Toner dengan niacinamide untuk mengecilkan pori dan mencerahkan',
        point_cost: 650,
        stock: 45,
        category_id: skincareCategory.id,
        required_privilege: null,
        is_active: true,
        foto_url: 'https://picsum.photos/400/300?random=20'
      }
    ];

    // Insert rewards
    for (const reward of rewards) {
      await prisma.rewards.create({
        data: reward
      });
    }

    console.log('✅ 20 rewards created successfully!');

    // 3. Create 30 dummy redemptions
    console.log('📦 Creating 30 dummy redemptions...');

    // Get some rewards for redemptions
    const allRewards = await prisma.rewards.findMany();
    
    // Helper function to get random date in the past
    const getRandomPastDate = (maxDaysAgo) => {
      const now = new Date();
      const randomDays = Math.floor(Math.random() * maxDaysAgo);
      const randomHours = Math.floor(Math.random() * 24);
      const randomMinutes = Math.floor(Math.random() * 60);
      return new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000) - (randomHours * 60 * 60 * 1000) - (randomMinutes * 60 * 1000));
    };

    const addresses = [
      'Jl. Merdeka No. 123, Jakarta Pusat',
      'Jl. Sudirman No. 456, Jakarta Selatan', 
      'Jl. Asia Afrika No. 789, Bandung',
      'Jl. Malioboro No. 321, Yogyakarta',
      'Jl. Diponegoro No. 654, Semarang',
      'Jl. Pahlawan No. 987, Surabaya',
      'Jl. Gajah Mada No. 147, Medan',
      'Jl. Imam Bonjol No. 258, Palembang',
      'Jl. Veteran No. 369, Makassar',
      'Jl. Ahmad Yani No. 741, Denpasar'
    ];

    const trackingNumbers = [
      'JNE123456789', 'POS987654321', 'TIKI555666777', 'SICEPAT111222',
      'GOSEND123', 'DIGITAL001', 'DIGITAL002', 'STEAM12345', 'DISCORD789',
      'ADOBE2024', 'GPLAY5678', 'OVO789123', 'ML567890', 'GOPAY456'
    ];

    // Create redemptions with different statuses
    const redemptions = [];

    // 10 menunggu_verifikasi
    for (let i = 0; i < 10; i++) {
      const reward = allRewards[i % allRewards.length];
      redemptions.push({
        id_member: (i % 10) + 1,
        id_reward: reward.id,
        points_spent: reward.point_cost,
        status: 'menunggu_verifikasi',
        redeemed_at: getRandomPastDate(1),
        shipping_address: addresses[i % addresses.length],
        tracking_number: null,
        admin_notes: null
      });
    }

    // 10 dikirim
    for (let i = 10; i < 20; i++) {
      const reward = allRewards[i % allRewards.length];
      redemptions.push({
        id_member: ((i - 10) % 10) + 1,
        id_reward: reward.id,
        points_spent: reward.point_cost,
        status: 'dikirim',
        redeemed_at: getRandomPastDate(7),
        shipping_address: addresses[i % addresses.length],
        tracking_number: trackingNumbers[i % trackingNumbers.length],
        admin_notes: `Paket telah dikirim via ${trackingNumbers[i % trackingNumbers.length].slice(0, 3)}`
      });
    }

    // 10 diterima
    for (let i = 20; i < 30; i++) {
      const reward = allRewards[i % allRewards.length];
      redemptions.push({
        id_member: ((i - 20) % 10) + 1,
        id_reward: reward.id,
        points_spent: reward.point_cost,
        status: 'diterima',
        redeemed_at: getRandomPastDate(15),
        shipping_address: addresses[i % addresses.length],
        tracking_number: trackingNumbers[i % trackingNumbers.length],
        admin_notes: 'Customer konfirmasi penerimaan, produk diterima dengan baik'
      });
    }

    // Insert redemptions
    for (const redemption of redemptions) {
      await prisma.reward_redemptions.create({
        data: redemption
      });
    }

    console.log('✅ 30 redemptions created successfully!');

    // Summary
    console.log('\n🎉 DUMMY DATA CREATION COMPLETE!');
    console.log('📊 Summary:');
    console.log('  - 2 reward categories (Digital, Skincare)');
    console.log('  - 20 rewards (10 Digital, 10 Skincare)');
    console.log('  - 6 rewards require "berkomunitasplus" privilege');
    console.log('  - 30 redemptions:');
    console.log('    * 10 menunggu_verifikasi');
    console.log('    * 10 dikirim');
    console.log('    * 10 diterima');
    console.log('\n🚀 Ready to test the reward system!');

  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyData();