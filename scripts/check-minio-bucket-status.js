/**
 * Debug: Check MinIO bucket and list objects
 */
const { S3Client, ListObjectsV2Command, HeadBucketCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config();

const s3Client = new S3Client({
  endpoint: `http://213.190.4.159:9000`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function checkBucket() {
  console.log('🔍 Checking MinIO Bucket Status');
  console.log('='*60);
  console.log(`Bucket: ${process.env.MINIO_BUCKET}`);
  console.log(`Endpoint: 213.190.4.159:9000`);
  console.log('');

  try {
    // Check if bucket exists
    console.log('[1/2] Checking if bucket exists...');
    const headCommand = new HeadBucketCommand({
      Bucket: process.env.MINIO_BUCKET,
    });
    
    await s3Client.send(headCommand);
    console.log('   ✅ Bucket exists!');
    console.log('');

    // List objects
    console.log('[2/2] Listing objects in bucket...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET,
      MaxKeys: 100,
    });

    const listResult = await s3Client.send(listCommand);
    const objects = listResult.Contents || [];

    console.log(`   📊 Total objects found: ${objects.length}`);
    
    if (objects.length > 0) {
      console.log('');
      console.log('   📁 First 20 objects:');
      objects.slice(0, 20).forEach((obj, i) => {
        const sizeKB = (obj.Size / 1024).toFixed(1);
        const date = obj.LastModified.toISOString().split('T')[0];
        console.log(`   ${i + 1}. ${obj.Key} (${sizeKB} KB, ${date})`);
      });

      // Count by folder
      const profilePics = objects.filter(o => o.Key.includes('profile-picture'));
      const migrated = objects.filter(o => o.Key.includes('migrated_'));
      
      console.log('');
      console.log('   📸 Profile pictures: ' + profilePics.length);
      console.log('   🔄 Migrated files: ' + migrated.length);
      
      if (migrated.length > 0) {
        console.log('');
        console.log('   ✅ Sample migrated files:');
        migrated.slice(0, 5).forEach(obj => {
          console.log(`      - ${obj.Key}`);
        });
      }
    } else {
      console.log('');
      console.log('   ⚠️  Bucket is EMPTY!');
      console.log('   This means uploads are NOT actually saving files.');
      console.log('');
      console.log('   Possible issues:');
      console.log('   1. MinIO storage volume not mounted correctly');
      console.log('   2. MinIO bucket policy prevents writes');
      console.log('   3. MinIO filesystem permissions issue');
      console.log('   4. MinIO version/configuration problem');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.Code || error.$metadata?.httpStatusCode);
    
    if (error.Code === 'NoSuchBucket') {
      console.log('');
      console.log('⚠️  Bucket does NOT exist!');
      console.log('   MinIO admin needs to create bucket "berkomunitas"');
    }
  }
}

checkBucket();
