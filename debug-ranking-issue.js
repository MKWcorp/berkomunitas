const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import employees list for testing
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
  'Ziaul Haq Alviani',
  'Riski Andra Widiyawati',
  'Fredy Dwi Herdhiawan',
  'Nanang Setiawan',
  'Azzahra Putri Lintang Madaratri',
  'Moch Iqbal Maulana Azis',
  'Nur Azizah Putri Sabila',
  'Yudha Bayu Widiana'
];

async function debugRankingLogic() {
  try {
    console.log('🔍 DEBUGGING RANKING LOGIC...\n');

    // 1. Get badge holders from database
    const drwCorpBadge = await prisma.badges.findFirst({
      where: { badge_name: 'DRW Corp' }
    });

    const badgeHoldersRaw = await prisma.member_badges.findMany({
      where: { id_badge: drwCorpBadge.id },
      include: {
        members: {
          include: {
            profil_sosial_media: {
              select: {
                username_sosmed: true,
                platform: true
              }
            }
          }
        }
      }
    });

    // Format badge holders like the API does
    const badgeHolders = badgeHoldersRaw
      .map((memberBadge) => {
        const member = memberBadge.members;
        const socialProfiles = member.profil_sosial_media || [];
        const primarySocialMedia = socialProfiles.length > 0 
          ? socialProfiles[0].username_sosmed 
          : `member_${member.id}`;

        return {
          id: member.id,
          nama_lengkap: member.nama_lengkap || 'Nama tidak tersedia',
          username_sosmed: primarySocialMedia,
          loyalty_point: member.loyalty_point || 0,
          earned_at: memberBadge.earned_at,
          social_platforms: socialProfiles.map(p => p.platform).join(', ') || 'Tidak ada'
        };
      })
      .sort((a, b) => b.loyalty_point - a.loyalty_point);

    console.log('👥 BADGE HOLDERS FROM DATABASE:');
    console.log(`Count: ${badgeHolders.length}`);
    badgeHolders.forEach((member, index) => {
      console.log(`${index + 1}. ${member.nama_lengkap} - ${member.loyalty_point} points`);
    });

    // 2. Create slave members from employee list
    const slaveMembers = DRW_CORP_EMPLOYEES.map((name, index) => ({
      id: `drwcorp-slave-${index + 1}`,
      nama_lengkap: name,
      loyalty_point: 0,
      username_sosmed: `drwcorp-${index + 1}`,
      tier: 'slave',
      isDrwCorpEmployee: true
    }));

    console.log('\n⛓️  SLAVE MEMBERS FROM EMPLOYEE LIST:');
    console.log(`Count: ${slaveMembers.length}`);
    slaveMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.nama_lengkap} - ${member.loyalty_point} points (Employee)`);
    });

    // 3. Combine logic (same as page.js)
    const allMembers = [
      ...badgeHolders,     // Rank 1-65: ONLY members with badges from member_badges table
      ...slaveMembers      // Rank 66+: ALL employee names from DRW_CORP_EMPLOYEES list
    ].slice(0, 155);

    console.log('\n🎯 FINAL COMBINED RESULT:');
    console.log(`Total members: ${allMembers.length}`);
    console.log('\nFirst 10 members:');
    allMembers.slice(0, 10).forEach((member, index) => {
      const type = member.isDrwCorpEmployee ? 'EMPLOYEE' : 'BADGE HOLDER';
      console.log(`Rank ${index + 1}: ${member.nama_lengkap} - ${member.loyalty_point} points [${type}]`);
    });

    console.log('\nMembers at rank 65-75:');
    allMembers.slice(64, 75).forEach((member, index) => {
      const type = member.isDrwCorpEmployee ? 'EMPLOYEE' : 'BADGE HOLDER';
      const rank = index + 65;
      console.log(`Rank ${rank}: ${member.nama_lengkap} - ${member.loyalty_point} points [${type}]`);
    });

    // 4. Check problematic names mentioned by user
    console.log('\n❌ CHECKING PROBLEMATIC NAMES:');
    const problematicNames = ['Hani Suryandari', 'Eri Kartono', 'Toto Krisdayanto'];
    
    problematicNames.forEach(name => {
      const foundInBadgeHolders = badgeHolders.find(member => 
        member.nama_lengkap.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(member.nama_lengkap.toLowerCase())
      );
      
      const foundInEmployees = slaveMembers.find(member => member.nama_lengkap === name);
      
      const positionInFinal = allMembers.findIndex(member => member.nama_lengkap === name);
      
      console.log(`\n"${name}":`);
      console.log(`  - In badge holders: ${foundInBadgeHolders ? 'YES - ' + foundInBadgeHolders.nama_lengkap : 'NO'}`);
      console.log(`  - In employee list: ${foundInEmployees ? 'YES' : 'NO'}`);
      console.log(`  - Final position: Rank ${positionInFinal + 1} (${positionInFinal < 37 ? 'BADGE HOLDER SECTION' : 'EMPLOYEE SECTION'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugRankingLogic();
