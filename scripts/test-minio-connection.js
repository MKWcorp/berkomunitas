/**
 * Test MinIO Connection
 * Run: node scripts/test-minio-connection.js
 */
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Hardcode config from .env for quick testing
const config = {
  MINIO_ENDPOINT: 'storage.berkomunitas.com',
  MINIO_ACCESS_KEY: 'drwcorp',
  MINIO_SECRET_KEY: 'Rahasiakita.88',
  MINIO_BUCKET: 'berkomunitas',
  MINIO_REGION: 'us-east-1',
  MINIO_USE_SSL: 'true',
  MINIO_PUBLIC_URL: 'https://storage.berkomunitas.com/berkomunitas'
};

console.log('🔧 MinIO Configuration:');
console.log('ENDPOINT:', config.MINIO_ENDPOINT);
console.log('ACCESS_KEY:', config.MINIO_ACCESS_KEY);
console.log('SECRET_KEY:', '***' + config.MINIO_SECRET_KEY.slice(-4));
console.log('BUCKET:', config.MINIO_BUCKET);
console.log('REGION:', config.MINIO_REGION);
console.log('USE_SSL:', config.MINIO_USE_SSL);
console.log('PUBLIC_URL:', config.MINIO_PUBLIC_URL);

const useSSL = config.MINIO_USE_SSL === 'true';
const protocol = useSSL ? 'https' : 'http';

console.log('\n📡 Creating S3 Client...');
const s3Client = new S3Client({
  endpoint: `${protocol}://${config.MINIO_ENDPOINT}`,
  region: config.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: config.MINIO_ACCESS_KEY,
    secretAccessKey: config.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

console.log('✅ S3 Client created');

// Test 1: List Buckets
console.log('\n🧪 Test 1: List Buckets');
try {
  const command = new ListBucketsCommand({});
  const response = await s3Client.send(command);
  console.log('✅ Success! Buckets:', response.Buckets.map(b => b.Name));
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.error('Error Details:', {
    name: error.name,
    code: error.Code || error.$metadata?.httpStatusCode,
    requestId: error.$metadata?.requestId
  });
}

// Test 2: Upload Test File
console.log('\n🧪 Test 2: Upload Test File');
try {
  const testContent = Buffer.from('Test upload from Node.js', 'utf-8');
  const fileName = `screenshots/test_${Date.now()}.txt`;
  
  const command = new PutObjectCommand({
    Bucket: config.MINIO_BUCKET,
    Key: fileName,
    Body: testContent,
    ContentType: 'text/plain',
  });
  
  const response = await s3Client.send(command);
  console.log('✅ Success! File uploaded');
  console.log('Public URL:', `${config.MINIO_PUBLIC_URL}/${fileName}`);
  console.log('ETag:', response.ETag);
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.error('Error Details:', {
    name: error.name,
    code: error.Code || error.$metadata?.httpStatusCode,
    requestId: error.$metadata?.requestId
  });
}

console.log('\n✅ Test completed');
