const { Client } = require('pg');

// Database connection using the same URL from .env
const client = new Client({
  connectionString: "postgresql://berkomunitas:berkomunitas688@213.190.4.159:5432/berkomunitas_db_dev"
});

async function insertDummyData() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // 1. Insert categories
    console.log('📁 Creating reward categories...');
    // Check and create missing categories
    const existingCategories = await client.query("SELECT name FROM reward_categories WHERE name IN ('Digital', 'Skincare')");
    const existingNames = existingCategories.rows.map(row => row.name);
    
    if (!existingNames.includes('Skincare')) {
      await client.query(`
        INSERT INTO reward_categories (name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        ('Skincare', 'Produk perawatan kulit dan kecantikan', 'heart', 'pink', 7, true, NOW(), NOW())
      `);
      console.log('✅ Added Skincare category');
    }

    // 2. Get category IDs  
    const digitalCategory = await client.query("SELECT id FROM reward_categories WHERE name = 'Digital'");
    const skincareCategory = await client.query("SELECT id FROM reward_categories WHERE name = 'Skincare'");
    
    if (digitalCategory.rows.length === 0 || skincareCategory.rows.length === 0) {
      throw new Error('Categories not found in database');
    }
    
    const digitalId = digitalCategory.rows[0].id;
    const skincareId = skincareCategory.rows[0].id;
    
    console.log('✅ Categories found - Digital ID:', digitalId, 'Skincare ID:', skincareId);

    // 3. Insert rewards
    console.log('🎁 Creating 20 dummy rewards...');
    
    const rewards = [
      // Digital rewards
      ['Steam Wallet $10', 'Voucher Steam untuk pembelian game digital senilai $10', 1500, 50, digitalId, null, true, 'https://picsum.photos/400/300?random=1'],
      ['Google Play Gift Card Rp100k', 'Voucher Google Play Store untuk pembelian aplikasi dan game', 1200, 30, digitalId, null, true, 'https://picsum.photos/400/300?random=2'],
      ['Netflix Premium 1 Bulan', 'Langganan Netflix Premium selama 1 bulan (Khusus Member Plus)', 2500, 10, digitalId, 'berkomunitasplus', true, 'https://picsum.photos/400/300?random=3'],
      ['Spotify Premium 3 Bulan', 'Langganan Spotify Premium selama 3 bulan (Eksklusif Member Plus)', 3000, 5, digitalId, 'berkomunitasplus', true, 'https://picsum.photos/400/300?random=4'],
      ['OVO Saldo Rp50k', 'Top up saldo OVO senilai Rp50.000', 800, 100, digitalId, null, true, 'https://picsum.photos/400/300?random=5'],
      ['GoPay Saldo Rp75k', 'Top up saldo GoPay senilai Rp75.000', 1000, 75, digitalId, null, true, 'https://picsum.photos/400/300?random=6'],
      ['Adobe Creative Cloud 1 Bulan', 'Akses penuh Adobe Creative Suite selama 1 bulan (Member Plus Only)', 4000, 3, digitalId, 'berkomunitasplus', true, 'https://picsum.photos/400/300?random=7'],
      ['Canva Pro 6 Bulan', 'Langganan Canva Pro dengan fitur premium selama 6 bulan', 2000, 15, digitalId, null, true, 'https://picsum.photos/400/300?random=8'],
      ['Mobile Legends Diamond 500', 'Voucher 500 Diamond untuk game Mobile Legends', 600, 200, digitalId, null, true, 'https://picsum.photos/400/300?random=9'],
      ['Discord Nitro 2 Bulan', 'Langganan Discord Nitro Premium selama 2 bulan (Eksklusif Plus)', 1800, 8, digitalId, 'berkomunitasplus', true, 'https://picsum.photos/400/300?random=10'],

      // Skincare rewards
      ['Serum Vitamin C 30ml', 'Serum brightening dengan Vitamin C untuk kulit glowing', 900, 25, skincareId, null, true, 'https://picsum.photos/400/300?random=11'],
      ['Masker Wajah Honey Gold', 'Masker wajah premium dengan ekstrak madu dan emas 24K', 1200, 40, skincareId, null, true, 'https://picsum.photos/400/300?random=12'],
      ['Set Skincare Premium Korea', 'Paket lengkap skincare Korea 7 steps (Eksklusif Member Plus)', 3500, 8, skincareId, 'berkomunitasplus', true, 'https://picsum.photos/400/300?random=13'],
      ['Sunscreen SPF 50+ PA+++', 'Tabir surya dengan perlindungan maksimal untuk kulit sensitif', 750, 60, skincareId, null, true, 'https://picsum.photos/400/300?random=14'],
      ['Retinol Night Cream', 'Krim malam anti-aging dengan retinol (Member Plus Only)', 2800, 12, skincareId, 'berkomunitasplus', true, 'https://picsum.photos/400/300?random=15'],
      ['Micellar Water 500ml', 'Pembersih wajah gentle untuk semua jenis kulit', 500, 80, skincareId, null, true, 'https://picsum.photos/400/300?random=16'],
      ['Facial Wash Charcoal', 'Sabun cuci muka dengan activated charcoal untuk kulit berminyak', 400, 100, skincareId, null, true, 'https://picsum.photos/400/300?random=17'],
      ['Eye Cream Anti-Aging', 'Krim mata premium untuk mengurangi kerutan dan kantung mata', 1500, 20, skincareId, null, true, 'https://picsum.photos/400/300?random=18'],
      ['Luxury Spa Treatment Set', 'Paket treatment spa premium di rumah (Khusus Member Plus)', 5000, 5, skincareId, 'berkomunitasplus', true, 'https://picsum.photos/400/300?random=19'],
      ['Toner Niacinamide 200ml', 'Toner dengan niacinamide untuk mengecilkan pori dan mencerahkan', 650, 45, skincareId, null, true, 'https://picsum.photos/400/300?random=20']
    ];

    for (const reward of rewards) {
      await client.query(`
        INSERT INTO rewards (reward_name, description, point_cost, stock, category_id, required_privilege, is_active, foto_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, reward);
    }

    console.log('✅ 20 rewards created successfully!');

    // 4. Get reward IDs for redemptions
    const rewardIds = await client.query('SELECT id FROM rewards ORDER BY id');
    const ids = rewardIds.rows.map(row => row.id);

    // 5. Insert 30 dummy redemptions
    console.log('📦 Creating 30 dummy redemptions...');
    
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

    // Helper function for random past dates
    const getRandomPastDate = (maxHoursAgo) => {
      const now = new Date();
      const randomHours = Math.floor(Math.random() * maxHoursAgo);
      return new Date(now.getTime() - (randomHours * 60 * 60 * 1000));
    };

    // Get some existing member IDs
    const membersResult = await client.query('SELECT id FROM members LIMIT 5');
    const memberIds = membersResult.rows.map(row => row.id);
    
    if (memberIds.length === 0) {
      throw new Error('No members found in database');
    }
    
    console.log('📋 Using member IDs:', memberIds);

    // Insert redemptions
    let redemptionCount = 0;

    // 10 menunggu_verifikasi
    for (let i = 0; i < 10; i++) {
      await client.query(`
        INSERT INTO reward_redemptions (id_member, id_reward, points_spent, status, redeemed_at, shipping_notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        memberIds[i % memberIds.length], // Use actual member IDs
        ids[i % ids.length],
        Math.floor(Math.random() * 2000) + 500, // 500-2500 points
        'menunggu_verifikasi',
        getRandomPastDate(6), // within last 6 hours
        addresses[i % addresses.length]
      ]);
      redemptionCount++;
    }

    // 10 dikirim
    for (let i = 0; i < 10; i++) {
      await client.query(`
        INSERT INTO reward_redemptions (id_member, id_reward, points_spent, status, redeemed_at, shipping_notes, shipping_tracking)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        memberIds[i % memberIds.length],
        ids[(i + 10) % ids.length],
        Math.floor(Math.random() * 2000) + 500,
        'dikirim',
        getRandomPastDate(72), // within last 3 days
        addresses[i % addresses.length],
        trackingNumbers[i % trackingNumbers.length]
      ]);
      redemptionCount++;
    }

    // 10 diterima
    for (let i = 0; i < 10; i++) {
      await client.query(`
        INSERT INTO reward_redemptions (id_member, id_reward, points_spent, status, redeemed_at, shipping_notes, shipping_tracking, delivered_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        memberIds[i % memberIds.length],
        ids[(i + 5) % ids.length],
        Math.floor(Math.random() * 2000) + 500,
        'diterima',
        getRandomPastDate(360), // within last 15 days
        addresses[i % addresses.length],
        trackingNumbers[i % trackingNumbers.length],
        getRandomPastDate(240) // delivered 10 days ago
      ]);
      redemptionCount++;
    }

    console.log(`✅ ${redemptionCount} redemptions created successfully!`);

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
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

insertDummyData();