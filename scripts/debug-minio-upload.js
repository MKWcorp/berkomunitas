/**
 * Debug MinIO upload - detailed logging
 */
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const fs = require('fs');

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

async function debugUpload() {
  console.log('🔍 DEBUG: MinIO Upload Test');
  console.log('='*60);
  console.log(`Endpoint: http://${process.env.MINIO_ENDPOINT}`);
  console.log(`Bucket: ${process.env.MINIO_BUCKET}`);
  console.log(`Access Key: ${process.env.MINIO_ACCESS_KEY}`);
  console.log(`Secret Key: ${process.env.MINIO_SECRET_KEY.substring(0, 4)}***`);
  console.log('='*60);
  console.log('');

  try {
    const testKey = 'debug-test-' + Date.now() + '.txt';
    const testContent = 'Debug test file\n' + new Date().toISOString();

    console.log('[STEP 1] Uploading test file...');
    console.log(`   Key: ${testKey}`);
    console.log(`   Content: ${testContent.length} bytes`);
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });

    console.log('   Sending PutObjectCommand...');
    const putResult = await s3Client.send(putCommand);
    console.log('   ✅ PutObjectCommand response:', JSON.stringify(putResult, null, 2));
    console.log('');

    // Try to read back immediately
    console.log('[STEP 2] Verifying file exists (HeadObject)...');
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: testKey,
      });
      const headResult = await s3Client.send(headCommand);
      console.log('   ✅ File exists!');
      console.log('   Metadata:', JSON.stringify(headResult, null, 2));
    } catch (headError) {
      console.log('   ❌ HeadObject failed:', headError.message);
      console.log('   Error code:', headError.Code || headError.$metadata?.httpStatusCode);
    }
    console.log('');

    // Try to get the file
    console.log('[STEP 3] Getting file content (GetObject)...');
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: testKey,
      });
      const getResult = await s3Client.send(getCommand);
      const body = await getResult.Body.transformToString();
      console.log('   ✅ File content retrieved!');
      console.log('   Content:', body);
    } catch (getError) {
      console.log('   ❌ GetObject failed:', getError.message);
    }
    console.log('');

    const publicUrl = `http://213.190.4.159:9100/${process.env.MINIO_BUCKET}/${testKey}`;
    console.log('[STEP 4] Public URL test:');
    console.log(`   URL: ${publicUrl}`);
    console.log('   Try accessing in browser or with curl');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Error details:', error);
  }
}

debugUpload();
