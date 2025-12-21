/**
 * Setup SSO Database
 * Initialize SSO tables and register platforms
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function generateApiKey(platformName) {
  const prefix = platformName.toLowerCase().replace(/\s+/g, '_');
  const random = crypto.randomBytes(32).toString('hex');
  return `sk_${prefix}_${random}`;
}

async function setupSSO() {
  console.log('='.repeat(70));
  console.log('🚀 SSO DATABASE SETUP');
  console.log('='.repeat(70));

  try {
    console.log('\n📊 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('\n🔧 Registering platforms...');

    const platforms = [
      {
        id: `plat_berkomunitas`,
        name: 'Berkomunitas',
        domain: 'berkomunitas.com',
        allowed_origins: ['https://berkomunitas.com', 'http://localhost:3000'],
        metadata: { description: 'Main community platform' },
      },
      {
        id: `plat_drwskincare`,
        name: 'DRW Skincare',
        domain: 'drwskincare.com',
        allowed_origins: ['https://drwskincare.com', 'http://localhost:3001'],
        metadata: { description: 'E-commerce platform' },
      },
      {
        id: `plat_drwprime`,
        name: 'DRW Prime',
        domain: 'drwprime.com',
        allowed_origins: ['https://drwprime.com'],
        metadata: { description: 'Premium membership platform' },
      },
      {
        id: `plat_beautycenter`,
        name: 'Beauty Center',
        domain: 'beautycenter.com',
        allowed_origins: ['https://beautycenter.com'],
        metadata: { description: 'Beauty consultation platform' },
      },
      {
        id: `plat_pos`,
        name: 'POS System',
        domain: 'pos.drwskincare.com',
        allowed_origins: ['*'],
        metadata: { description: 'Mobile POS (Android/iOS)', type: 'mobile' },
      },
    ];

    const registeredPlatforms = [];

    for (const platform of platforms) {
      try {
        const apiKey = generateApiKey(platform.name);

        const registered = await prisma.registeredPlatform.upsert({
          where: { name: platform.name },
          update: {
            domain: platform.domain,
            allowed_origins: platform.allowed_origins,
            metadata: platform.metadata,
            is_active: true,
          },
          create: {
            ...platform,
            api_key: apiKey,
          },
        });

        registeredPlatforms.push(registered);
        console.log(`   ✅ ${platform.name}: ${registered.api_key}`);
      } catch (error) {
        console.error(`   ❌ Failed to register ${platform.name}:`, error.message);
      }
    }

    console.log('\n📋 Registered Platforms Summary:');
    console.log('='.repeat(70));
    registeredPlatforms.forEach(p => {
      console.log(`Platform: ${p.name}`);
      console.log(`Domain: ${p.domain}`);
      console.log(`API Key: ${p.api_key}`);
      console.log(`Status: ${p.is_active ? '🟢 Active' : '🔴 Inactive'}`);
      console.log('-'.repeat(70));
    });

    console.log('\n✅ SSO setup completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Save these API keys in a secure location');
    console.log('2. Configure Google OAuth credentials in .env');
    console.log('3. Test the SSO login flow');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup
setupSSO()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
