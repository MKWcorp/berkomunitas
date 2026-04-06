/**
 * Test MinIO Connection dengan SSL/HTTPS support
 */
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Test dengan berbagai kombinasi endpoint
async function testEndpoint(name, config) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 TEST: ${name}`);
  console.log(`${'='.repeat(70)}`);
  console.log('Config:', JSON.stringify(config, null, 2));
  
  const s3Client = new S3Client(config);

  try {
    // Test 1: Upload
    const testKey = `test-uploads/test-${Date.now()}.txt`;
    const testContent = `Test from ${name} at ${new Date().toISOString()}`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });

    console.log('\n[1/2] Testing upload...');
    await s3Client.send(putCommand);
    console.log(`   ✅ Upload SUCCESS!`);
    console.log(`   📁 Key: ${testKey}`);

    // Test 2: List
    console.log('\n[2/2] Testing list objects...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET,
      MaxKeys: 10,
    });

    const result = await s3Client.send(listCommand);
    const count = result.Contents?.length || 0;
    console.log(`   ✅ List SUCCESS!`);
    console.log(`   📊 Objects found: ${count}`);
    
    if (result.Contents && result.Contents.length > 0) {
      console.log('\n   📁 Files:');
      result.Contents.forEach((obj, i) => {
        console.log(`      ${i + 1}. ${obj.Key} (${(obj.Size / 1024).toFixed(1)} KB)`);
      });
    }
    
    return { success: true, count };
    
  } catch (error) {
    console.log(`   ❌ FAILED!`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Status: ${error.$metadata?.httpStatusCode || 'N/A'}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 MINIO CONNECTION DIAGNOSTIC');
  console.log('='.repeat(70));
  console.log(`Bucket: ${process.env.MINIO_BUCKET}`);
  console.log(`Access Key: ${process.env.MINIO_ACCESS_KEY}`);
  console.log(`SSL Setting (.env): ${process.env.MINIO_USE_SSL}`);
  
  const results = [];

  // Test 1: HTTPS (public endpoint - sesuai .env)
  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const protocol = useSSL ? 'https' : 'http';
  results.push(await testEndpoint('Public HTTPS (dari .env)', {
    endpoint: `${protocol}://${process.env.MINIO_ENDPOINT}`,
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  }));

  // Test 2: Direct IP dengan HTTP
  results.push(await testEndpoint('Direct IP:9000 (HTTP)', {
    endpoint: 'http://213.190.4.159:9000',
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  }));

  // Test 3: Direct IP dengan port 9100 (jika ada reverse proxy)
  results.push(await testEndpoint('Direct IP:9100 (HTTP)', {
    endpoint: 'http://213.190.4.159:9100',
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  }));

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(70)}`);
  
  results.forEach((result, i) => {
    const testNames = [
      'Public HTTPS (dari .env)',
      'Direct IP:9000 (HTTP)',
      'Direct IP:9100 (HTTP)'
    ];
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${testNames[i]}: ${status}`);
    if (result.success) {
      console.log(`   → ${result.count} objects in bucket`);
    } else {
      console.log(`   → Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  
  // Recommendation
  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length === 0) {
    console.log('⚠️  SEMUA TEST GAGAL!');
    console.log('   Kemungkinan masalah:');
    console.log('   1. MinIO server down');
    console.log('   2. Kredensial salah');
    console.log('   3. Firewall blocking');
    console.log('   4. Bucket tidak ada');
  } else if (successfulTests[0].count === 0) {
    console.log('⚠️  KONEKSI BERHASIL TAPI BUCKET KOSONG!');
    console.log('   Artinya:');
    console.log('   - Foto yang di-upload sebelumnya TIDAK tersimpan');
    console.log('   - Atau foto tersimpan di endpoint/bucket yang berbeda');
    console.log('   - Atau ada masalah saat migrasi/upload');
  } else {
    console.log('✅ Koneksi OK dan ada file di bucket!');
  }
  
  console.log('\n');
}

main();
