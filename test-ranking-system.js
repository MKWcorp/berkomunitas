// 🧪 TEST SCRIPT: Ranking System Components

const { RANKING_LEVELS, findUserLevel, getNextLevel, calculateLoyaltyNeeded, LEVEL_STATS } = require('./src/lib/rankingLevels.js');

console.log('🕌 TESTING SISTEM RANKING ISLAMI\n');

// Test Data
const testUsers = [
  { id: 1, username: 'admin', total_loyalty: 105000, total_comments: 150 },
  { id: 2, username: 'moderator', total_loyalty: 75000, total_comments: 120 },
  { id: 3, username: 'member1', total_loyalty: 45000, total_comments: 85 },
  { id: 4, username: 'member2', total_loyalty: 25000, total_comments: 60 },
  { id: 5, username: 'newbie', total_loyalty: 5000, total_comments: 10 },
  { id: 6, username: 'starter', total_loyalty: 500, total_comments: 5 }
];

console.log('📊 LEVEL STATS:');
console.log(`Total Levels: ${LEVEL_STATS.total_levels}`);
console.log(`Surga Levels: ${LEVEL_STATS.surga_levels}`);
console.log(`Dunia Levels: ${LEVEL_STATS.dunia_levels}`);
console.log(`Neraka Levels: ${LEVEL_STATS.neraka_levels}`);
console.log(`Canvas Height: ${LEVEL_STATS.canvas_height}px\n`);

console.log('👥 USER LEVEL TESTING:');
testUsers.forEach(user => {
  const level = findUserLevel(user.total_loyalty);
  const nextLevel = getNextLevel(level);
  const loyaltyNeeded = calculateLoyaltyNeeded(user.total_loyalty, level);

  console.log(`\n${user.username} (${user.total_loyalty.toLocaleString()} loyalty):`);
  console.log(`  Level: ${level.name} (${level.nameArabic})`);
  console.log(`  Category: ${level.category} | Rank: #${level.rank}`);
  console.log(`  Position: Y=${level.position.top} H=${level.position.height}`);
  
  if (nextLevel && loyaltyNeeded > 0) {
    console.log(`  Next: ${nextLevel.name} (need ${loyaltyNeeded.toLocaleString()} more)`);
  } else {
    console.log(`  Status: 🌟 MAX LEVEL!`);
  }
  
  console.log(`  Narration: "${level.narration}"`);
});

console.log('\n🎯 LEVEL DISTRIBUTION ANALYSIS:');
const surga_users = testUsers.filter(u => findUserLevel(u.total_loyalty).category === 'surga');
const dunia_users = testUsers.filter(u => findUserLevel(u.total_loyalty).category === 'dunia');
const neraka_users = testUsers.filter(u => findUserLevel(u.total_loyalty).category === 'neraka');

console.log(`🌟 Surga: ${surga_users.length} users`);
console.log(`🌍 Dunia: ${dunia_users.length} users`);
console.log(`🔥 Neraka: ${neraka_users.length} users`);

console.log('\n✅ RANKING SYSTEM TEST COMPLETED!');
console.log('📝 Next: Start development server dan akses /custom-dashboard/ranking');
