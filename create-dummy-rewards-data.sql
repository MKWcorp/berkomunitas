-- Create reward categories
INSERT INTO reward_categories (name, description, color, created_at) VALUES
('Digital', 'Produk dan layanan digital seperti e-money, voucher game, dan aplikasi premium', '#3B82F6', NOW()),
('Skincare', 'Produk perawatan kulit dan kecantikan', '#EC4899', NOW())
ON CONFLICT (name) DO NOTHING;

-- Create 20 dummy rewards with mix of categories and privilege requirements
INSERT INTO rewards (reward_name, description, point_cost, stock, category_id, required_privilege, is_active, created_at, foto_url) VALUES
-- Digital rewards (10 items)
('Steam Wallet $10', 'Voucher Steam untuk pembelian game digital senilai $10', 1500, 50, (SELECT id FROM reward_categories WHERE name = 'Digital'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=1'),
('Google Play Gift Card Rp100k', 'Voucher Google Play Store untuk pembelian aplikasi dan game', 1200, 30, (SELECT id FROM reward_categories WHERE name = 'Digital'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=2'),
('Netflix Premium 1 Bulan', 'Langganan Netflix Premium selama 1 bulan (Khusus Member Plus)', 2500, 10, (SELECT id FROM reward_categories WHERE name = 'Digital'), 'berkomunitasplus', true, NOW(), 'https://picsum.photos/400/300?random=3'),
('Spotify Premium 3 Bulan', 'Langganan Spotify Premium selama 3 bulan (Eksklusif Member Plus)', 3000, 5, (SELECT id FROM reward_categories WHERE name = 'Digital'), 'berkomunitasplus', true, NOW(), 'https://picsum.photos/400/300?random=4'),
('OVO Saldo Rp50k', 'Top up saldo OVO senilai Rp50.000', 800, 100, (SELECT id FROM reward_categories WHERE name = 'Digital'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=5'),
('GoPay Saldo Rp75k', 'Top up saldo GoPay senilai Rp75.000', 1000, 75, (SELECT id FROM reward_categories WHERE name = 'Digital'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=6'),
('Adobe Creative Cloud 1 Bulan', 'Akses penuh Adobe Creative Suite selama 1 bulan (Member Plus Only)', 4000, 3, (SELECT id FROM reward_categories WHERE name = 'Digital'), 'berkomunitasplus', true, NOW(), 'https://picsum.photos/400/300?random=7'),
('Canva Pro 6 Bulan', 'Langganan Canva Pro dengan fitur premium selama 6 bulan', 2000, 15, (SELECT id FROM reward_categories WHERE name = 'Digital'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=8'),
('Mobile Legends Diamond 500', 'Voucher 500 Diamond untuk game Mobile Legends', 600, 200, (SELECT id FROM reward_categories WHERE name = 'Digital'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=9'),
('Discord Nitro 2 Bulan', 'Langganan Discord Nitro Premium selama 2 bulan (Eksklusif Plus)', 1800, 8, (SELECT id FROM reward_categories WHERE name = 'Digital'), 'berkomunitasplus', true, NOW(), 'https://picsum.photos/400/300?random=10'),

-- Skincare rewards (10 items)
('Serum Vitamin C 30ml', 'Serum brightening dengan Vitamin C untuk kulit glowing', 900, 25, (SELECT id FROM reward_categories WHERE name = 'Skincare'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=11'),
('Masker Wajah Honey Gold', 'Masker wajah premium dengan ekstrak madu dan emas 24K', 1200, 40, (SELECT id FROM reward_categories WHERE name = 'Skincare'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=12'),
('Set Skincare Premium Korea', 'Paket lengkap skincare Korea 7 steps (Eksklusif Member Plus)', 3500, 8, (SELECT id FROM reward_categories WHERE name = 'Skincare'), 'berkomunitasplus', true, NOW(), 'https://picsum.photos/400/300?random=13'),
('Sunscreen SPF 50+ PA+++', 'Tabir surya dengan perlindungan maksimal untuk kulit sensitif', 750, 60, (SELECT id FROM reward_categories WHERE name = 'Skincare'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=14'),
('Retinol Night Cream', 'Krim malam anti-aging dengan retinol (Member Plus Only)', 2800, 12, (SELECT id FROM reward_categories WHERE name = 'Skincare'), 'berkomunitasplus', true, NOW(), 'https://picsum.photos/400/300?random=15'),
('Micellar Water 500ml', 'Pembersih wajah gentle untuk semua jenis kulit', 500, 80, (SELECT id FROM reward_categories WHERE name = 'Skincare'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=16'),
('Facial Wash Charcoal', 'Sabun cuci muka dengan activated charcoal untuk kulit berminyak', 400, 100, (SELECT id FROM reward_categories WHERE name = 'Skincare'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=17'),
('Eye Cream Anti-Aging', 'Krim mata premium untuk mengurangi kerutan dan kantung mata', 1500, 20, (SELECT id FROM reward_categories WHERE name = 'Skincare'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=18'),
('Luxury Spa Treatment Set', 'Paket treatment spa premium di rumah (Khusus Member Plus)', 5000, 5, (SELECT id FROM reward_categories WHERE name = 'Skincare'), 'berkomunitasplus', true, NOW(), 'https://picsum.photos/400/300?random=19'),
('Toner Niacinamide 200ml', 'Toner dengan niacinamide untuk mengecilkan pori dan mencerahkan', 650, 45, (SELECT id FROM reward_categories WHERE name = 'Skincare'), NULL, true, NOW(), 'https://picsum.photos/400/300?random=20');

-- Create 30 dummy redemptions with various statuses
INSERT INTO reward_redemptions (id_member, id_reward, points_spent, status, redeemed_at, shipping_address, tracking_number, admin_notes) VALUES
-- Menunggu verifikasi (10 records)
(1, (SELECT id FROM rewards WHERE reward_name = 'Steam Wallet $10' LIMIT 1), 1500, 'menunggu_verifikasi', NOW() - INTERVAL '2 hours', 'Jl. Merdeka No. 123, Jakarta Pusat', NULL, NULL),
(2, (SELECT id FROM rewards WHERE reward_name = 'Google Play Gift Card Rp100k' LIMIT 1), 1200, 'menunggu_verifikasi', NOW() - INTERVAL '1 hour', 'Jl. Sudirman No. 456, Jakarta Selatan', NULL, NULL),
(3, (SELECT id FROM rewards WHERE reward_name = 'Serum Vitamin C 30ml' LIMIT 1), 900, 'menunggu_verifikasi', NOW() - INTERVAL '30 minutes', 'Jl. Asia Afrika No. 789, Bandung', NULL, NULL),
(4, (SELECT id FROM rewards WHERE reward_name = 'OVO Saldo Rp50k' LIMIT 1), 800, 'menunggu_verifikasi', NOW() - INTERVAL '45 minutes', 'Jl. Malioboro No. 321, Yogyakarta', NULL, NULL),
(5, (SELECT id FROM rewards WHERE reward_name = 'Masker Wajah Honey Gold' LIMIT 1), 1200, 'menunggu_verifikasi', NOW() - INTERVAL '3 hours', 'Jl. Diponegoro No. 654, Semarang', NULL, NULL),
(6, (SELECT id FROM rewards WHERE reward_name = 'Mobile Legends Diamond 500' LIMIT 1), 600, 'menunggu_verifikasi', NOW() - INTERVAL '15 minutes', 'Jl. Pahlawan No. 987, Surabaya', NULL, NULL),
(7, (SELECT id FROM rewards WHERE reward_name = 'Sunscreen SPF 50+ PA+++' LIMIT 1), 750, 'menunggu_verifikasi', NOW() - INTERVAL '4 hours', 'Jl. Gajah Mada No. 147, Medan', NULL, NULL),
(8, (SELECT id FROM rewards WHERE reward_name = 'GoPay Saldo Rp75k' LIMIT 1), 1000, 'menunggu_verifikasi', NOW() - INTERVAL '25 minutes', 'Jl. Imam Bonjol No. 258, Palembang', NULL, NULL),
(9, (SELECT id FROM rewards WHERE reward_name = 'Micellar Water 500ml' LIMIT 1), 500, 'menunggu_verifikasi', NOW() - INTERVAL '1.5 hours', 'Jl. Veteran No. 369, Makassar', NULL, NULL),
(10, (SELECT id FROM rewards WHERE reward_name = 'Canva Pro 6 Bulan' LIMIT 1), 2000, 'menunggu_verifikasi', NOW() - INTERVAL '5 hours', 'Jl. Ahmad Yani No. 741, Denpasar', NULL, NULL),

-- Dikirim (10 records)
(11, (SELECT id FROM rewards WHERE reward_name = 'Facial Wash Charcoal' LIMIT 1), 400, 'dikirim', NOW() - INTERVAL '1 day', 'Jl. Kartini No. 852, Balikpapan', 'JNE123456789', 'Paket telah dikirim via JNE'),
(12, (SELECT id FROM rewards WHERE reward_name = 'Eye Cream Anti-Aging' LIMIT 1), 1500, 'dikirim', NOW() - INTERVAL '2 days', 'Jl. Cut Nyak Dien No. 963, Banda Aceh', 'POS987654321', 'Dikirim menggunakan Pos Indonesia'),
(13, (SELECT id FROM rewards WHERE reward_name = 'Toner Niacinamide 200ml' LIMIT 1), 650, 'dikirim', NOW() - INTERVAL '3 days', 'Jl. Hasanuddin No. 741, Palu', 'TIKI555666777', 'Pengiriman via TIKI Express'),
(14, (SELECT id FROM rewards WHERE reward_name = 'Netflix Premium 1 Bulan' LIMIT 1), 2500, 'dikirim', NOW() - INTERVAL '6 hours', 'Jl. Wahid Hasyim No. 159, Pontianak', 'DIGITAL001', 'Kode akses dikirim via email'),
(15, (SELECT id FROM rewards WHERE reward_name = 'Spotify Premium 3 Bulan' LIMIT 1), 3000, 'dikirim', NOW() - INTERVAL '12 hours', 'Jl. Teuku Umar No. 753, Banjarmasin', 'DIGITAL002', 'Voucher code telah dikirim'),
(16, (SELECT id FROM rewards WHERE reward_name = 'Steam Wallet $10' LIMIT 1), 1500, 'dikirim', NOW() - INTERVAL '18 hours', 'Jl. Sultan Agung No. 846, Samarinda', 'STEAM12345', 'Steam wallet code delivered'),
(17, (SELECT id FROM rewards WHERE reward_name = 'Discord Nitro 2 Bulan' LIMIT 1), 1800, 'dikirim', NOW() - INTERVAL '8 hours', 'Jl. Jendral Sudirman No. 357, Manado', 'DISCORD789', 'Nitro subscription activated'),
(18, (SELECT id FROM rewards WHERE reward_name = 'Set Skincare Premium Korea' LIMIT 1), 3500, 'dikirim', NOW() - INTERVAL '4 days', 'Jl. Pangeran Diponegoro No. 951, Mataram', 'SICEPAT111222', 'Paket premium dikirim SiCepat'),
(19, (SELECT id FROM rewards WHERE reward_name = 'Adobe Creative Cloud 1 Bulan' LIMIT 1), 4000, 'dikirim', NOW() - INTERVAL '2 hours', 'Jl. RA Kartini No. 654, Jayapura', 'ADOBE2024', 'License key telah dikirim'),
(20, (SELECT id FROM rewards WHERE reward_name = 'Google Play Gift Card Rp100k' LIMIT 1), 1200, 'dikirim', NOW() - INTERVAL '1 day', 'Jl. Moh. Hatta No. 789, Padang', 'GPLAY5678', 'Gift card code sent via SMS'),

-- Diterima (10 records)
(21, (SELECT id FROM rewards WHERE reward_name = 'Serum Vitamin C 30ml' LIMIT 1), 900, 'diterima', NOW() - INTERVAL '7 days', 'Jl. Pemuda No. 123, Solo', 'JNE111222333', 'Customer konfirmasi penerimaan'),
(22, (SELECT id FROM rewards WHERE reward_name = 'Masker Wajah Honey Gold' LIMIT 1), 1200, 'diterima', NOW() - INTERVAL '10 days', 'Jl. Gatot Subroto No. 456, Cirebon', 'POS444555666', 'Produk diterima dalam kondisi baik'),
(23, (SELECT id FROM rewards WHERE reward_name = 'OVO Saldo Rp50k' LIMIT 1), 800, 'diterima', NOW() - INTERVAL '5 days', 'Jl. Ahmad Dahlan No. 789, Purwokerto', 'OVO789123', 'Saldo berhasil masuk ke akun'),
(24, (SELECT id FROM rewards WHERE reward_name = 'Mobile Legends Diamond 500' LIMIT 1), 600, 'diterima', NOW() - INTERVAL '3 days', 'Jl. Soekarno Hatta No. 321, Malang', 'ML567890', 'Diamond berhasil masuk ke game'),
(25, (SELECT id FROM rewards WHERE reward_name = 'GoPay Saldo Rp75k' LIMIT 1), 1000, 'diterima', NOW() - INTERVAL '8 days', 'Jl. Ir. Soekarno No. 654, Kediri', 'GOPAY456', 'Saldo GoPay berhasil ditambahkan'),
(26, (SELECT id FROM rewards WHERE reward_name = 'Sunscreen SPF 50+ PA+++' LIMIT 1), 750, 'diterima', NOW() - INTERVAL '12 days', 'Jl. Pahlawan No. 987, Tegal', 'TIKI777888', 'Sunscreen diterima, packaging aman'),
(27, (SELECT id FROM rewards WHERE reward_name = 'Retinol Night Cream' LIMIT 1), 2800, 'diterima', NOW() - INTERVAL '6 days', 'Jl. Diponegoro No. 147, Bogor', 'JNE999000', 'Cream premium diterima dengan baik'),
(28, (SELECT id FROM rewards WHERE reward_name = 'Micellar Water 500ml' LIMIT 1), 500, 'diterima', NOW() - INTERVAL '15 days', 'Jl. Asia Afrika No. 258, Sukabumi', 'POS111333', 'Customer puas dengan produk'),
(29, (SELECT id FROM rewards WHERE reward_name = 'Luxury Spa Treatment Set' LIMIT 1), 5000, 'diterima', NOW() - INTERVAL '9 days', 'Jl. Merdeka No. 369, Bekasi', 'GOSEND123', 'Paket luxury spa set lengkap'),
(30, (SELECT id FROM rewards WHERE reward_name = 'Canva Pro 6 Bulan' LIMIT 1), 2000, 'diterima', NOW() - INTERVAL '4 days', 'Jl. Veteran No. 741, Depok', 'CANVA2024', 'Akun Canva Pro berhasil diaktivasi');