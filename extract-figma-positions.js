// Script untuk mengekstrak positioning dari figma design
const fs = require('fs');

// Baca file figma
const figmaContent = fs.readFileSync('./src/app/custom-dashboard/drwcorp/figma-design-drwcorp.js', 'utf8');

// Pattern untuk mencari rank positioning
const rankPattern = /\/\* Rank(\d+) \*\/[\s\S]*?position: absolute;[\s\S]*?width: ([\d.]+)px;[\s\S]*?height: ([\d.]+)px;[\s\S]*?left: ([\d.]+)px;[\s\S]*?top: ([\d.]+)px;/g;

// Pattern untuk mencari background color setelah rank
const colorPattern = /\/\* Rank(\d+) \*\/[\s\S]*?background: (#[A-F0-9]+|[a-zA-Z]+);/g;

// Extract all rank positions
const positions = [];
let match;

// Reset regex
rankPattern.lastIndex = 0;
while ((match = rankPattern.exec(figmaContent)) !== null) {
    const [, rank, width, height, left, top] = match;
    positions.push({
        rank: parseInt(rank),
        x: parseFloat(left),
        y: parseFloat(top),
        width: parseFloat(width),
        height: parseFloat(height)
    });
}

// Extract colors
const colors = {};
colorPattern.lastIndex = 0;
while ((match = colorPattern.exec(figmaContent)) !== null) {
    const [, rank, color] = match;
    colors[rank] = color;
}

console.log('Extracted positions:', positions.length);
console.log('First 10 positions:');
positions.slice(0, 10).forEach(pos => {
    console.log(`Rank ${pos.rank}: x=${pos.x}, y=${pos.y}, w=${pos.width}, h=${pos.height}, color=${colors[pos.rank] || 'N/A'}`);
});

// Generate rank configuration
const rankConfig = positions.map(pos => {
    let tier = 'unknown';
    let fontSize = 9;
    
    // Determine tier based on rank and size
    if (pos.rank <= 3) {
        tier = 'mighty';
        fontSize = 20;
    } else if (pos.rank <= 8) {
        tier = 'guard';
        fontSize = 12;
    } else if (pos.rank <= 20) {
        tier = 'servant';
        fontSize = 9;
    } else if (pos.rank <= 30) {
        tier = 'commoners';
        fontSize = 9;
    } else if (pos.rank <= 40) {
        tier = 'freepy';
        fontSize = 9;
    } else if (pos.rank <= 50) {
        tier = 'lowly';
        fontSize = 9;
    } else if (pos.rank <= 65) {
        tier = 'former';
        fontSize = 9;
    } else {
        tier = 'slave';
        fontSize = 9;
    }

    return `  { rank: ${pos.rank}, x: ${pos.x}, y: ${pos.y}, width: ${pos.width}, height: ${pos.height}, fontSize: ${fontSize}, tier: '${tier}' },`;
});

// Write to file
fs.writeFileSync('./figma-extracted-positions.js', rankConfig.join('\n'));
console.log('Positions written to figma-extracted-positions.js');
