# 💰 Dual-Currency System FAQ
*Updated: September 12, 2025*

## ❓ **Frequently Asked Questions**

### **🔰 Basic Understanding**

**Q: Apa itu sistem dual-currency?**
A: Sistem dua mata uang yang terdiri dari:
- **Loyalty Point**: Record permanen untuk ranking/status (tidak bisa berkurang)
- **Coin**: Currency yang bisa dihabiskan untuk menukar reward

**Q: Apa perbedaan Loyalty Point vs Coin?**
A: 
- **Loyalty Point**: 
  - ✅ Permanent record untuk leaderboard
  - ✅ Tidak pernah berkurang
  - ✅ Menunjukkan total kontribusi member
- **Coin**: 
  - 💰 Spendable currency  
  - 💸 Berkurang saat redeem reward
  - 🔄 Bisa di-topup (future feature)

---

### **⚙️ System Behavior**

**Q: Bagaimana cara sistem menambah points?**
A: Setiap kali member mendapat loyalty point (task completion, bonus, dll):
- ✅ Loyalty Point bertambah
- ✅ Coin otomatis bertambah dengan jumlah yang sama
- ✅ Keduanya tetap sinkron

**Q: Apa yang terjadi saat redeem reward?**
A: Saat member menukar reward:
- 💰 Coin berkurang sesuai harga reward
- 🏆 Loyalty Point tetap tidak berubah (permanent record)
- 📋 Transaksi ter-log lengkap untuk audit

**Q: Apakah coin bisa melebihi loyalty point?**
A: ❌ Tidak mungkin. Sistem memiliki validation yang mencegah coin > loyalty_point.

---

### **🔍 Troubleshooting**

**Q: Mengapa coin saya lebih kecil dari loyalty point?**
A: Ini normal jika Anda sudah pernah menukar reward. Contoh:
- Loyalty Point: 1000 (permanent record)
- Coin: 750 (setelah redeem reward seharga 250)

**Q: Bagaimana cara cek riwayat transaksi?**
A: Semua transaksi ter-log otomatis dengan detail:
- Waktu transaksi
- Jenis transaksi (earning/spending)
- Amount dan balance
- Reference/bukti transaksi

**Q: Coin tidak bertambah saat dapat loyalty point?**
A: Sistem baru sudah dilengkapi auto-sync trigger. Jika masih terjadi:
1. Refresh browser (Ctrl+F5)
2. Check di halaman profile
3. Contact admin jika tetap tidak sync

---

### **🛠️ For Developers**

**Q: Bagaimana cara add points via API?**
A: Gunakan endpoint loyalty_point_history. Coin akan otomatis tersync via database trigger.

**Q: Bagaimana cara handle redemption?**
A: 
1. Kurangi coin dari member
2. Create reward_redemption record  
3. Sistem otomatis log transaksi

**Q: Apakah N8N workflow perlu diubah?**
A: ❌ Tidak. Workflow existing tetap berfungsi karena sistem backward compatible.

---

### **🚀 Future Features**

**Q: Apakah bisa topup coin dengan uang?**
A: Fitur ini sedang dikembangkan dan akan tersedia soon. Coin bisa di-topup via:
- Payment gateway integration
- Transfer bank
- E-wallet integration

**Q: Apakah akan ada currency lain?**
A: Ya, DRW Point sedang dalam planning untuk business partnership rewards.

---

### **🆘 Support**

**Q: Coin/loyalty point hilang atau tidak sesuai?**
A: Contact admin dengan informasi:
- Username/nama lengkap
- Screenshot before/after
- Aktivitas yang dilakukan
- Waktu kejadian

**Q: Error saat redeem reward?**
A: Pastikan:
- Coin cukup untuk harga reward
- Reward masih tersedia (stock)
- Koneksi internet stabil
- Jika tetap error, contact support

---

## 📊 **System Health Status**

✅ **Auto-sync**: Active (coin otomatis sync dengan loyalty)  
✅ **Data integrity**: Protected (validation triggers)  
✅ **Audit trail**: Complete (semua transaksi ter-log)  
✅ **Backward compatibility**: Maintained (API lama tetap work)

---

*Last updated: September 12, 2025*
*System version: v2.0 - Dual Currency with Auto-Sync*
