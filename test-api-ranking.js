// Test API Ranking System
async function testRankingAPI() {
  try {
    console.log('🧪 Testing Ranking API...\n');
    
    const response = await fetch('http://localhost:3000/api/ranking/leaderboard');
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ API Success! Total users: ${data.total_users}`);
      console.log(`📅 Last update: ${new Date(data.timestamp).toLocaleString('id-ID')}\n`);
      
      console.log('👥 Top 10 Users:');
      console.log('================================');
      
      data.data.slice(0, 10).forEach((user, index) => {
        const displayName = user.display_name || user.nama_lengkap || user.username || `Member ${user.id}`;
        console.log(`${index + 1}. ${displayName}`);
        console.log(`   Loyalty: ${user.total_loyalty.toLocaleString()}`);
        console.log(`   Comments: ${user.total_comments}`);
        console.log(`   Member since: ${new Date(user.member_since).toLocaleDateString('id-ID') || 'N/A'}`);
        console.log('');
      });
      
      // Show distribution
      const surga = data.data.filter(u => u.total_loyalty >= 50000).length;
      const dunia = data.data.filter(u => u.total_loyalty >= 10000 && u.total_loyalty < 50000).length;
      const neraka = data.data.filter(u => u.total_loyalty < 10000).length;
      
      console.log('🏆 Level Distribution:');
      console.log(`🌟 Surga: ${surga} users`);
      console.log(`🌍 Dunia: ${dunia} users`);
      console.log(`🔥 Neraka: ${neraka} users`);
      
    } else {
      console.error('❌ API Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testRankingAPI();
