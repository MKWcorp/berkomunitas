/**
 * Generate secure JWT secrets for SSO
 * Run this once to generate secrets for your .env file
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('='.repeat(70));
console.log('🔐 JWT SECRETS GENERATOR FOR SSO');
console.log('='.repeat(70));
console.log('\n⚠️  IMPORTANT: Add these to your .env file and NEVER commit them to Git!\n');

const jwtSecret = generateSecret(64);
const jwtRefreshSecret = generateSecret(64);

console.log('# JWT Secrets (Generated on ' + new Date().toISOString() + ')');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);

console.log('\n' + '='.repeat(70));
console.log('✅ Secrets generated successfully!');
console.log('📝 Copy the lines above and paste them into your .env file');
console.log('='.repeat(70));
console.log('\n💡 Next steps:');
console.log('1. Add these secrets to your .env file');
console.log('2. Get Google OAuth credentials from https://console.cloud.google.com');
console.log('3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
console.log('4. Run: npm install');
console.log('5. Run: npx prisma migrate dev');
console.log('6. Test login at /api/sso/google-login');
console.log('='.repeat(70));
