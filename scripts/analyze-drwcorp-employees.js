#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com/api/drwcorp-employees'
  : 'http://localhost:3000/api/drwcorp-employees';

async function analyzeDRWCorpEmployees() {
  try {
    console.log('🔍 Menganalisis pegawai DRW Corp...\n');

    const response = await fetch(API_URL);
    const data = await response.json();

    if (!data.success) {
      console.error('❌ Error:', data.error);
      return;
    }

    const { summary, registered_employees, unregistered_employees, slave_list, recommendations } = data;

    // Header
    console.log('=' .repeat(80));
    console.log('📊 ANALISIS PEGAWAI DRW CORP');
    console.log('=' .repeat(80));

    // Summary
    console.log('\n📈 RINGKASAN:');
    console.log(`   Total Pegawai: ${summary.total_employees}`);
    console.log(`   Sudah Terdaftar: ${summary.registered_count}`);
    console.log(`   Belum Terdaftar: ${summary.unregistered_count}`);
    console.log(`   Persentase Pendaftaran: ${summary.registration_percentage}%`);

    // Registered Employees
    console.log('\n✅ PEGAWAI YANG SUDAH TERDAFTAR:');
    console.log('-'.repeat(80));

    if (registered_employees.length === 0) {
      console.log('   Tidak ada pegawai yang terdaftar');
    } else {
      registered_employees.forEach((emp, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${emp.nama_pegawai}`);
        console.log(`    Loyalty Points: ${emp.registered_data.loyalty_point.toLocaleString()}`);
        console.log(`    Member ID: ${emp.registered_data.id}`);
        console.log('');
      });
    }

    // Slave List (Unregistered Employees)
    console.log('\n🚫 SLAVE LIST - PEGAWAI YANG BELUM TERDAFTAR:');
    console.log('=' .repeat(80));
    console.log(`Total: ${slave_list.total} pegawai\n`);

    if (slave_list.employees.length === 0) {
      console.log('   Semua pegawai sudah terdaftar! 🎉');
    } else {
      slave_list.employees.forEach((name, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${name}`);
      });
    }

    // Recommendations
    if (recommendations.length > 0) {
      console.log('\n💡 REKOMENDASI (Kemungkinan Kesalahan Penulisan):');
      console.log('-'.repeat(80));

      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.nama_pegawai}`);
        rec.possible_matches.forEach(match => {
          console.log(`   → ${match.existingName} (${Math.round(match.similarity * 100)}% similarity)`);
        });
        console.log('');
      });
    }

    // Action Items
    console.log('\n🎯 ACTION ITEMS:');
    console.log('-'.repeat(80));

    if (slave_list.employees.length > 0) {
      console.log('1. Daftarkan pegawai berikut ke sistem:');
      slave_list.employees.slice(0, 5).forEach(name => {
        console.log(`   - ${name}`);
      });
      if (slave_list.employees.length > 5) {
        console.log(`   ... dan ${slave_list.employees.length - 5} pegawai lainnya`);
      }
    }

    if (recommendations.length > 0) {
      console.log('\n2. Periksa kemungkinan duplikasi nama:');
      recommendations.slice(0, 3).forEach(rec => {
        console.log(`   - ${rec.nama_pegawai} → ${rec.possible_matches[0].existingName}`);
      });
    }

    console.log('\n✨ Analisis selesai!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Jalankan analisis
analyzeDRWCorpEmployees();
