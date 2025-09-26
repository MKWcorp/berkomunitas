const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDuplicationFilter() {
  try {
    console.log('🔍 Testing Duplication Filter Logic...\n');

    // Get badge holders from database
    const drwCorpBadge = await prisma.badges.findFirst({
      where: { badge_name: 'DRW Corp' }
    });

    const badgeHolders = await prisma.member_badges.findMany({
      where: { id_badge: drwCorpBadge.id },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            loyalty_point: true
          }
        }
      },
      orderBy: {
        members: { loyalty_point: 'desc' }
      }
    });

    const members = badgeHolders.map(item => item.members);
    console.log('👥 Badge Holders:', members.length);
    console.log('Names:', members.map(m => m.nama_lengkap));

    // Read DRW Corp employees list
    const fs = require('fs');
    const path = require('path');
    
    // Import employees list
    const DRW_CORP_EMPLOYEES = [
      'Eri Kartono',
      'Hani Suryandari', 
      'Andri Alamsyah',
      'Ayi Miraj Sidik Yatno',
      'Deni Kristanto',
      'Prajnavidya Adhivijna',
      'Muhammad Khoirul Wiro',
      'Iin Risanti',
      'Muhammad Rijal Yahya',
      'Muhammad Faris Al-Hakim',
      'Ulung Muchlis Nugroho',
      'Shofa Tasya Aulia',
      'Seny Triastuti',
      'Asti Apriani Suyatno',
      'Haris Ahsan Haq Jauhary',
      'Syahroni Binugroho',
      'Sinaring Randri Aditia',
      'Wildan Hari Pratama',
      'Dinda Nadya Salsabila',
      'Wildan Arif Rahmatulloh',
      'Toto Krisdayanto',
      'Annisatul Khoiryyah',
      'Tara Derifatoni',
      'Wahyu Bagus Septian',
      'Ahmad Andrian Syah',
      'Aulia Putri',
      'Hasri Handayani',
      'Abidzar Afif',
      'Hawary Ansorullah',
      'Dian Elsa Rosiana',
      'Kristy Karina Silalahi',
      'Muhammad Kamalurrofiq',
      'Bintang Armuneta',
      'Mohammad Bintang Lazuardi',
      'Layli Noor Ifadhoh',
      'Gega Putra Perdana',
      'Angga Saputra',
      'Deandra Marhaendra',
      'Eep Sugiarto',
      'Agus Sumarno',
      'Rinto Atmojo',
      'Andhika bagus sanjaya',
      'Eka Aprilia',
      'Ihsan Dzaky Saputra',
      'Danang Demestian',
      'Ziaul Haq Alviani'
    ];

    console.log('\n🏢 Total DRW Corp Employees:', DRW_CORP_EMPLOYEES.length);

    // Apply duplication filter
    const registeredNames = members.map(member => 
      member.nama_lengkap.toLowerCase().trim()
    );

    console.log('\n🔍 Registered Names (lowercase):');
    registeredNames.forEach((name, index) => {
      console.log(`${index + 1}. "${name}"`);
    });

    const unregisteredEmployees = DRW_CORP_EMPLOYEES.filter(employeeName => {
      const normalizedEmployee = employeeName.toLowerCase().trim();
      
      return !registeredNames.some(registeredName => {
        if (normalizedEmployee === registeredName) return true;
        if (normalizedEmployee.includes(registeredName) || 
            registeredName.includes(normalizedEmployee)) return true;
        return false;
      });
    });

    console.log('\n✅ Unregistered Employees (will appear in slave tier):');
    console.log('Count:', unregisteredEmployees.length);
    unregisteredEmployees.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });

    console.log('\n❌ Filtered Out (already registered):');
    const filteredOut = DRW_CORP_EMPLOYEES.filter(employeeName => {
      const normalizedEmployee = employeeName.toLowerCase().trim();
      return registeredNames.some(registeredName => {
        if (normalizedEmployee === registeredName) return true;
        if (normalizedEmployee.includes(registeredName) || 
            registeredName.includes(normalizedEmployee)) return true;
        return false;
      });
    });
    
    filteredOut.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });

    console.log('\n📊 SUMMARY:');
    console.log('================================');
    console.log(`Badge Holders (Ranks 1-${members.length}): ${members.length}`);
    console.log(`Unregistered Employees (Ranks ${members.length + 1}-${members.length + unregisteredEmployees.length}): ${unregisteredEmployees.length}`);
    console.log(`Filtered Out: ${filteredOut.length}`);
    console.log(`Total Display: ${members.length + unregisteredEmployees.length} / 155`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDuplicationFilter();
