const fs = require('fs');

// Read the figma file
const content = fs.readFileSync('src/app/custom-dashboard/drwcorp/figma-design-drwcorp.js', 'utf8');

// Extract all rank data with regex
const rankPattern = /\/\* Rank(\d+) \*\/[\s\S]*?left: ([\d.]+)px;\s*top: ([\d.]+)px;[\s\S]*?background: (#[A-F0-9]{6}|#FFFFFF);/gi;

const ranks = {};
let match;

while ((match = rankPattern.exec(content)) !== null) {
  const rankNum = parseInt(match[1]);
  const x = parseFloat(match[2]);
  const y = parseFloat(match[3]);
  const bg = match[4];
  
  // Determine size based on rank
  let width, height, tier;
  if (rankNum <= 3) {
    width = 180; height = 45; tier = 'TOP3';
  } else if (rankNum <= 8) {
    width = 120; height = 30; tier = 'LORD';
  } else {
    width = 82.22; height = 20.56; tier = 'GUARD';
  }
  
  if (!ranks[rankNum]) {
    ranks[rankNum] = { x, y, width, height, tier, bg };
  }
}

// Sort and output
const sortedRanks = Object.keys(ranks).sort((a, b) => parseInt(a) - parseInt(b));

console.log('// COMPLETE 111 rank positions from Figma:');
console.log('export const exactFigmaPositions = {');

sortedRanks.forEach(rank => {
  const pos = ranks[rank];
  console.log(`  ${rank}: { x: ${pos.x}, y: ${pos.y}, width: ${pos.width}, height: ${pos.height}, tier: '${pos.tier}', bg: '${pos.bg}' },`);
});

console.log('};');
console.log(`\n// Found ${sortedRanks.length} ranks (${Math.min(...sortedRanks)} - ${Math.max(...sortedRanks)})`);

// Check for missing
const missing = [];
for (let i = 1; i <= 111; i++) {
  if (!ranks[i]) missing.push(i);
}
if (missing.length > 0) {
  console.log(`Missing: ${missing.join(', ')}`);
}
