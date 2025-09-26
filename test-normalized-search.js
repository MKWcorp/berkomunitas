import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNewSearch() {
  try {
    console.log('=== Testing New Normalized Search ===');
    
    // Test dengan berbagai format input
    const testCases = [
      '282-302-1009-1003-2001', // Format dengan strip
      '282302100910032001',      // Format tanpa strip
      '282 302 1009 1003 2001',  // Format dengan spasi
      '282.302.1009.1003.2001'   // Format dengan titik
    ];
    
    for (const testInput of testCases) {
      console.log(`\n--- Testing input: "${testInput}" ---`);
      
      // Normalize input sama seperti API
      const normalizedInput = testInput.replace(/[^0-9]/g, '');
      console.log('Normalized to:', normalizedInput);
      
      // Query dengan raw SQL seperti di API
      const results = await prisma.$queryRaw`
        SELECT 
          "resellerId",
          "nama_reseller", 
          "nomor_hp",
          "whatsapp_number"
        FROM "bc_drwskincare_api" 
        WHERE REGEXP_REPLACE("resellerId", '[^0-9]', '', 'g') = ${normalizedInput}
        LIMIT 3
      `;
      
      console.log(`Found ${results.length} matches:`, results.map(r => ({
        original: r.resellerId,
        normalized: r.resellerId.replace(/[^0-9]/g, ''),
        nama: r.nama_reseller
      })));
    }
    
    // Test partial matches juga
    console.log(`\n--- Testing partial matches ---`);
    const partialResults = await prisma.$queryRaw`
      SELECT 
        "resellerId",
        "nama_reseller"
      FROM "bc_drwskincare_api" 
      WHERE REGEXP_REPLACE("resellerId", '[^0-9]', '', 'g') LIKE ${'282302%'}
      LIMIT 5
    `;
    
    console.log('Partial matches:', partialResults);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewSearch();