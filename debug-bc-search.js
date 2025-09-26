import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugBCSearch() {
  try {
    console.log('=== Debugging BC Search ===');
    
    const testResellerId = '282-302-1009-1003-2001';
    const testPhone = '083147748219';
    
    console.log('Test input:', { testResellerId, testPhone });
    
    // 1. Check exact format
    console.log('\n1. Searching exact format with dashes:');
    const exactMatch = await prisma.bc_drwskincare_api.findMany({
      where: {
        resellerId: testResellerId
      },
      select: {
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true
      }
    });
    console.log('Exact match results:', exactMatch);
    
    // 2. Check without dashes
    const noDashFormat = testResellerId.replace(/[^0-9]/g, '');
    console.log('\n2. Searching format without dashes:', noDashFormat);
    const noDashMatch = await prisma.bc_drwskincare_api.findMany({
      where: {
        resellerId: noDashFormat
      },
      select: {
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true
      }
    });
    console.log('No dash match results:', noDashMatch);
    
    // 3. Check contains with dashes
    console.log('\n3. Searching contains with dashes:');
    const containsDashMatch = await prisma.bc_drwskincare_api.findMany({
      where: {
        resellerId: {
          contains: testResellerId
        }
      },
      select: {
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true
      }
    });
    console.log('Contains dash match results:', containsDashMatch);
    
    // 4. Check contains without dashes
    console.log('\n4. Searching contains without dashes:');
    const containsNoDashMatch = await prisma.bc_drwskincare_api.findMany({
      where: {
        resellerId: {
          contains: noDashFormat
        }
      },
      select: {
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true
      }
    });
    console.log('Contains no dash match results:', containsNoDashMatch);
    
    // 5. Check partial matches (maybe partial ID works)
    console.log('\n5. Searching partial matches:');
    const partialMatches = await prisma.bc_drwskincare_api.findMany({
      where: {
        OR: [
          { resellerId: { contains: '282302' } },
          { resellerId: { contains: '282-302' } },
          { resellerId: { contains: '1009' } }
        ]
      },
      select: {
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true
      }
    });
    console.log('Partial match results:', partialMatches);
    
    // 6. Check phone number matches
    console.log('\n6. Checking phone number matches:');
    const phoneMatches = await prisma.bc_drwskincare_api.findMany({
      where: {
        OR: [
          { nomor_hp: testPhone },
          { nomor_hp: { contains: testPhone } },
          { whatsapp_number: testPhone },
          { whatsapp_number: { contains: testPhone } },
          // Try with 62 prefix
          { nomor_hp: { contains: testPhone.replace('08', '628') } },
          { whatsapp_number: { contains: testPhone.replace('08', '628') } }
        ]
      },
      select: {
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true
      }
    });
    console.log('Phone match results:', phoneMatches);
    
    // 7. Get sample data to understand format
    console.log('\n7. Sample data from table:');
    const sampleData = await prisma.bc_drwskincare_api.findMany({
      take: 5,
      select: {
        resellerId: true,
        nama_reseller: true,
        nomor_hp: true,
        whatsapp_number: true
      }
    });
    console.log('Sample records:', sampleData);
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBCSearch();