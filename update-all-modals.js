// Script untuk mengupdate semua modal di tab admin
// Menambahkan dukungan untuk posisi dinamis pada semua AdminModal

const fs = require('fs');
const path = require('path');

const tabsDir = './src/app/admin/tabs';
const files = fs.readdirSync(tabsDir).filter(file => file.endsWith('.js') && file !== 'SocialMediaTab.js' && file !== 'TasksTab.js' && file !== 'MembersTab.js');

console.log('Files to update:', files);

// Fungsi untuk menambahkan modalPosition state jika belum ada
function addModalPositionState(content) {
  // Cari pattern state modal yang ada
  const statePattern = /(\[show.*Modal.*,\s*set.*Modal.*\]\s*=\s*useState\(false\);)/g;
  
  if (statePattern.test(content) && !content.includes('modalPosition')) {
    return content.replace(
      statePattern,
      '$1\n  const [modalPosition, setModalPosition] = useState(null);'
    );
  }
  return content;
}

// Fungsi untuk mengupdate onClick handlers
function updateOnClickHandlers(content) {
  // Update onClick yang memanggil modal
  content = content.replace(
    /onClick=\{(\(\)\s*=>\s*\{[^}]*set[^}]*Modal[^}]*true[^}]*\})\}/g,
    'onClick={(e) => { if (e) { setModalPosition({ top: e.clientY, left: e.clientX }); } else { setModalPosition(null); } $1 }}'
  );
  
  return content;
}

// Fungsi untuk mengupdate AdminModal props
function updateAdminModalProps(content) {
  return content.replace(
    /(<AdminModal[^>]*?)(\s*>)/g,
    '$1\n        position={modalPosition}$2'
  );
}

// Process each file
files.forEach(file => {
  try {
    const filePath = path.join(tabsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't use AdminModal
    if (!content.includes('AdminModal')) {
      console.log(`Skipping ${file} - doesn't use AdminModal`);
      return;
    }
    
    console.log(`Processing ${file}...`);
    
    const originalContent = content;
    
    // Apply transformations
    content = addModalPositionState(content);
    content = updateOnClickHandlers(content);
    content = updateAdminModalProps(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${file}`);
    } else {
      console.log(`⏭️  No changes needed for ${file}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('✨ Done updating all modal files!');
