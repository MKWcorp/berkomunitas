/**
 * Test presigned URL generation
 */
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const dotenv = require('dotenv');

dotenv.config();

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function testPresignedUrl() {
  console.log('🔐 Testing Presigned URL');
  console.log('='*60);
  
  try {
    const testKey = 'debug-presigned-' + Date.now() + '.txt';
    const testContent = 'Presigned URL test\n' + new Date().toISOString();

    // Upload file
    console.log('[1/2] Uploading test file...');
    const putCommand = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });

    await s3Client.send(putCommand);
    console.log(`   ✅ Uploaded: ${testKey}`);
    console.log('');

    // Generate presigned URL (valid for 7 days)
    console.log('[2/2] Generating presigned URL...');
    const getCommand = new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: testKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    console.log('   ✅ Presigned URL generated!');
    console.log('');
    console.log('='*60);
    console.log('📎 PRESIGNED URL:');
    console.log(presignedUrl);
    console.log('='*60);
    console.log('');
    console.log('💡 Copy the URL above and open in browser');
    console.log('   It should show the file content.');
    console.log('   URL valid for 7 days.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPresignedUrl();
