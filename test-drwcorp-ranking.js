// Test script untuk mengecek ranking DRW Corp
const fetch = require('node-fetch');

async function testDRWCorpRanking() {
  try {
    console.log('🧪 TESTING DRW CORP RANKING API...\n');

    // Test API endpoint
    const response = await fetch('http://localhost:3000/api/custom-dashboard/drwcorp', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      const badgeHolders = data.data;
      
      console.log(`✅ API Response Success`);
      console.log(`📊 Badge Holders Count: ${badgeHolders.length}`);
      console.log(`🏆 Badge Info: ${data.badge_info.badge_name}`);
      console.log(`👥 Total Holders: ${data.badge_info.total_holders}\n`);
      
      console.log('🥇 TOP 10 BADGE HOLDERS:');
      badgeHolders.slice(0, 10).forEach((member, index) => {
        console.log(`${index + 1}. ${member.nama_lengkap} - ${member.loyalty_point} points (${member.tier})`);
      });

      console.log('\n🔍 CHECKING TIER DISTRIBUTION:');
      const tierCount = {};
      badgeHolders.forEach(member => {
        tierCount[member.tier] = (tierCount[member.tier] || 0) + 1;
      });
      
      Object.entries(tierCount).forEach(([tier, count]) => {
        console.log(`${tier}: ${count} members`);
      });

      console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
      
    } else {
      console.error('❌ API Error:', data.error);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Import DRW Corp employees for comparison
const DRW_CORP_EMPLOYEES = [
  'Andri Alamsyah',
  'Ayi Miraj Sidik Yatno',
  'Seny Triastuti',
  'Abidzar Afif',
  'Bintang Armuneta',
  'Mohammad Bintang Lazuardi',
  'Gega Putra Perdana',
  'Eep Sugiarto',
  'Agus Sumarno',
  'Rinto Atmojo',
  'Andhika bagus sanjaya',
  'Ihsan Dzaky Saputra',
  'Danang Demestian',
  'Riski Andra Widiyawati',
  'Nanang Setiawan',
  'Nur Azizah Putri Sabila',
  'Yudha Bayu Widiana'
];

console.log(`📋 DRW CORP EMPLOYEES (${DRW_CORP_EMPLOYEES.length} total):`);
DRW_CORP_EMPLOYEES.forEach((name, index) => {
  console.log(`${index + 66}. ${name} - 0 points (slave)`);
});

console.log('\n🚀 Starting API test...\n');
testDRWCorpRanking();
