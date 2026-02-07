/**
 * Test MinIO upload with @aws-sdk/client-s3
 * To verify if uploads are working
 */
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config();

// Configure S3 client for MinIO
const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function testUpload() {
  console.log('🧪 Testing MinIO Upload');
  console.log('================================');
  console.log(`Endpoint: http://${process.env.MINIO_ENDPOINT}`);
  console.log(`Bucket: ${process.env.MINIO_BUCKET}`);
  console.log('');

  try {
    // Test 1: Upload a test file (WITHOUT ACL parameter)
    console.log('[1/3] Uploading test file...');
    const testKey = 'test-uploads/test-' + Date.now() + '.txt';
    const testContent = 'Hello from MinIO test!\n' + new Date().toISOString();

    const putCommand = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
      // No ACL parameter - MinIO doesn't support it
    });

    await s3Client.send(putCommand);
    const publicUrl = `http://213.190.4.159:9100/${process.env.MINIO_BUCKET}/${testKey}`;
    console.log(`   ✅ Upload successful!`);
    console.log(`   📁 Key: ${testKey}`);
    console.log(`   🔗 URL: ${publicUrl}`);
    console.log('');

    // Test 2: List objects in bucket
    console.log('[2/3] Listing objects in bucket...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET,
      MaxKeys: 20,
    });

    const listResult = await s3Client.send(listCommand);
    const objects = listResult.Contents || [];
    console.log(`   ✅ Found ${objects.length} object(s)`);
    
    if (objects.length > 0) {
      console.log(`   📁 First few objects:`);
      objects.slice(0, 10).forEach(obj => {
        console.log(`      - ${obj.Key} (${(obj.Size / 1024).toFixed(1)} KB)`);
      });
    }
    console.log('');

    // Test 3: Count profile pictures
    const profilePics = objects.filter(obj => obj.Key.includes('profile-picture'));
    const migrated = objects.filter(obj => obj.Key.includes('migrated_'));
    
    console.log('[3/3] Analysis:');
    console.log(`   📸 Profile pictures: ${profilePics.length}`);
    console.log(`   🔄 Migrated files: ${migrated.length}`);
    console.log('');

    console.log('================================');
    console.log('✅ MinIO connection is WORKING!');
    
    if (migrated.length === 0) {
      console.log('');
      console.log('⚠️  WARNING: No migrated files found!');
      console.log('   This means the migration script did NOT actually upload files.');
      console.log('   Likely reason: ACL parameter caused silent failure.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error:', error);
  }
}

testUpload();
