const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('Starting...');
    
    const members = await prisma.members.findMany({
      where: {
        OR: [
          { foto_profil_url: null },
          { foto_profil_url: '' },
          { foto_profil_url: 'https://via.placeholder.com/150' }
        ]
      },
      select: {
        id: true,
        nama_lengkap: true,
        google_id: true,
        foto_profil_url: true
      }
    });

    console.log(`Found ${members.length} members`);
    
    for (const member of members) {
      console.log(`Member ${member.id}: ${member.nama_lengkap || 'NULL'}`);
      
      const seed = member.nama_lengkap || member.clerk_id || `user${member.id}`;
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed.toLowerCase().trim())}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      
      console.log(`Generated: ${avatarUrl}`);
      
      // Update
      await prisma.members.update({
        where: { id: member.id },
        data: { foto_profil_url: avatarUrl }
      });
      
      console.log('Updated!');
    }
    
    console.log('Done');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
