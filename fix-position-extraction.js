const fs = require('fs');

// Read the figma file
const content = fs.readFileSync('src/app/custom-dashboard/drwcorp/figma-design-drwcorp.js', 'utf8');

// Extract ranks with more precise parsing
const ranks = {};

// Split into lines and process
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Look for rank comments
  const rankMatch = line.match(/\/\* Rank(\d+) \*\//);
  if (rankMatch) {
    const rankNum = parseInt(rankMatch[1]);
    
    // Look ahead for the first occurrence of position: absolute
    for (let j = i + 1; j < i + 20 && j < lines.length; j++) {
      if (lines[j].includes('position: absolute;')) {
        // Extract width, height, left, top from the next few lines
        let width, height, left, top, background;
        
        for (let k = j + 1; k < j + 15 && k < lines.length; k++) {
          const currentLine = lines[k].trim();
          
          if (currentLine.match(/width: ([\d.]+)px;/)) {
            width = parseFloat(currentLine.match(/width: ([\d.]+)px;/)[1]);
          }
          if (currentLine.match(/height: ([\d.]+)px;/)) {
            height = parseFloat(currentLine.match(/height: ([\d.]+)px;/)[1]);
          }
          if (currentLine.match(/left: ([\d.]+)px;/)) {
            left = parseFloat(currentLine.match(/left: ([\d.]+)px;/)[1]);
          }
          if (currentLine.match(/top: ([\d.]+)px;/)) {
            top = parseFloat(currentLine.match(/top: ([\d.]+)px;/)[1]);
          }
          if (currentLine.match(/background: (#[A-F0-9]{6}|#FFFFFF);/)) {
            background = currentLine.match(/background: (#[A-F0-9]{6}|#FFFFFF);/)[1];
          }
          
          // Once we have all basic info, save it (only first occurrence per rank)
          if (width && height && left !== undefined && top !== undefined && !ranks[rankNum]) {
            // Determine tier
            let tier;
            if (rankNum <= 3) tier = 'TOP3';
            else if (rankNum <= 8) tier = 'LORD';
            else tier = 'GUARD';
            
            ranks[rankNum] = { x: left, y: top, width, height, tier, bg: background || '#FFFFFF' };
            break;
          }
        }
        break;
      }
    }
  }
}

// Sort and output
const sortedRanks = Object.keys(ranks).sort((a, b) => parseInt(a) - parseInt(b));

console.log('// CORRECTED positions from Figma design:');
console.log('export const exactFigmaPositions = {');

sortedRanks.forEach(rank => {
  const pos = ranks[rank];
  console.log(`  ${rank}: { x: ${pos.x}, y: ${pos.y}, width: ${pos.width}, height: ${pos.height}, tier: '${pos.tier}', bg: '${pos.bg}' },`);
});

console.log('};');

console.log(`\n// CORRECTED: Found ${sortedRanks.length} ranks`);
console.log(`Range: ${Math.min(...sortedRanks)} - ${Math.max(...sortedRanks)}`);

// Print first 10 for verification
console.log('\n// First 10 ranks verification:');
sortedRanks.slice(0, 10).forEach(rank => {
  const pos = ranks[rank];
  console.log(`Rank ${rank}: (${pos.x}, ${pos.y}) ${pos.width}x${pos.height} ${pos.tier}`);
});
