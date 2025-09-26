// Script to extract exact positions from figma-design-drwcorp.js
const fs = require('fs');

// Read the figma design file
const figmaContent = fs.readFileSync('src/app/custom-dashboard/drwcorp/figma-design-drwcorp.js', 'utf8');

// Extract rank positions
const ranks = {};

const lines = figmaContent.split('\n');

lines.forEach((line, index) => {
  // Check for rank comments
  const rankMatch = line.match(/\/\* Rank(\d+) \*\//);
  if (rankMatch) {
    const rankNum = parseInt(rankMatch[1]);
    
    // Look for the position data in the next few lines
    let width, height, left, top, background;
    
    for (let i = index + 1; i < index + 25; i++) {
      if (lines[i]) {
        const widthMatch = lines[i].match(/width: ([\d.]+)px;/);
        const heightMatch = lines[i].match(/height: ([\d.]+)px;/);
        const leftMatch = lines[i].match(/left: ([\d.]+)px;/);
        const topMatch = lines[i].match(/top: ([\d.]+)px;/);
        const bgMatch = lines[i].match(/background: (#[A-F0-9]{6}|#[A-F0-9]{3}|#FFFFFF);/);
        
        if (widthMatch) width = parseFloat(widthMatch[1]);
        if (heightMatch) height = parseFloat(heightMatch[1]);
        if (leftMatch) left = parseFloat(leftMatch[1]);
        if (topMatch) top = parseFloat(topMatch[1]);
        if (bgMatch) background = bgMatch[1];
        
        // Save the position when we find it for the first time
        if (width && height && left !== undefined && top !== undefined && !ranks[rankNum]) {
          ranks[rankNum] = { x: left, y: top, width, height, background };
          break;
        }
      }
    }
  }
});

// Output the extracted positions
console.log('// EXACT positions from 5047-line Figma design:');
console.log('export const exactFigmaPositions = {');

// Sort by rank number
const sortedRanks = Object.keys(ranks).sort((a, b) => parseInt(a) - parseInt(b));

sortedRanks.forEach(rank => {
  const pos = ranks[rank];
  console.log(`  ${rank}: { x: ${pos.x}, y: ${pos.y}, width: ${pos.width}, height: ${pos.height}${pos.background ? `, bg: '${pos.background}'` : ''} },`);
});

console.log('};');

console.log('\n// Summary:');
console.log(`Total ranks found: ${sortedRanks.length}`);
console.log(`Rank range: ${Math.min(...sortedRanks.map(r => parseInt(r)))} - ${Math.max(...sortedRanks.map(r => parseInt(r)))}`);

// Check for missing ranks
const missingRanks = [];
for (let i = 1; i <= 111; i++) {
  if (!ranks[i]) {
    missingRanks.push(i);
  }
}

if (missingRanks.length > 0) {
  console.log(`Missing ranks: ${missingRanks.join(', ')}`);
};
