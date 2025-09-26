// Test script untuk mengecek API DRW Corp yang sudah diupdate
const fetch = require('node-fetch');

async function testUpdatedDRWCorpAPI() {
  try {
    console.log('🧪 TESTING UPDATED DRW CORP API (ALL MEMBERS)...\n');

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
      const allMembers = data.data;
      
      console.log(`✅ API Response Success`);
      console.log(`📊 Total Members: ${allMembers.length}`);
      console.log(`🏆 DRW Corp Badge Holders: ${data.stats.drw_corp_holders}`);
      console.log(`👥 Regular Members: ${data.stats.regular_members}\n`);
      
      console.log('🥇 TOP 10 MEMBERS (by loyalty points):');
      allMembers.slice(0, 10).forEach((member, index) => {
        const badgeText = member.hasDrwCorpBadge ? '🏆 DRW Corp' : 'No badge';
        const badges = member.badges.join(', ') || 'None';
        console.log(`${index + 1}. ${member.nama_lengkap} - ${member.loyalty_point} points (${member.tier}) - Badges: ${badges}`);
      });

      console.log('\n📋 MEMBERS WITH DRW CORP BADGE:');
      const drwCorpMembers = allMembers.filter(m => m.hasDrwCorpBadge);
      drwCorpMembers.slice(0, 5).forEach((member, index) => {
        console.log(`${index + 1}. ${member.nama_lengkap} - ${member.loyalty_point} points (${member.tier})`);
      });

      console.log('\n👨‍💼 CHECKING DRW CORP EMPLOYEES:');
      const DRW_CORP_EMPLOYEES = [
        'Andri Alamsyah', 'Ayi Miraj Sidik Yatno', 'Seny Triastuti', 'Abidzar Afif',
        'Bintang Armuneta', 'Mohammad Bintang Lazuardi', 'Gega Putra Perdana', 
        'Eep Sugiarto', 'Agus Sumarno', 'Rinto Atmojo', 'Andhika bagus sanjaya',
        'Ihsan Dzaky Saputra', 'Danang Demestian', 'Riski Andra Widiyawati',
        'Nanang Setiawan', 'Nur Azizah Putri Sabila', 'Yudha Bayu Widiana'
      ];

      const employeesInDatabase = [];
      DRW_CORP_EMPLOYEES.forEach(empName => {
        const found = allMembers.find(member => 
          member.nama_lengkap.toLowerCase().includes(empName.toLowerCase()) ||
          empName.toLowerCase().includes(member.nama_lengkap.toLowerCase())
        );
        if (found) {
          employeesInDatabase.push({
            employee: empName,
            member: found.nama_lengkap,
            points: found.loyalty_point,
            badges: found.badges.join(', ')
          });
        }
      });

      console.log(`Found ${employeesInDatabase.length} DRW Corp employees in database:`);
      employeesInDatabase.forEach(emp => {
        console.log(`- ${emp.member} (${emp.points} pts) - Badges: ${emp.badges || 'None'}`);
      });

      console.log('\n🔍 TIER DISTRIBUTION:');
      const tierCount = {};
      allMembers.forEach(member => {
        tierCount[member.tier] = (tierCount[member.tier] || 0) + 1;
      });
      
      Object.entries(tierCount).forEach(([tier, count]) => {
        console.log(`${tier}: ${count} members`);
      });

      console.log('\n✅ API TEST COMPLETED SUCCESSFULLY');
      
    } else {
      console.error('❌ API Error:', data.error);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

console.log('🚀 Starting updated API test...\n');
testUpdatedDRWCorpAPI();
