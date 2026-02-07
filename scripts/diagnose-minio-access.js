/**
 * MinIO Access Diagnostic Tool
 * 
 * Tests public access to MinIO storage from client side
 * Run from local machine: node scripts/diagnose-minio-access.js
 */

const https = require('https');
const http = require('http');

// Test URLs
const tests = [
  {
    name: 'Subdomain Health Check',
    url: 'http://storage.berkomunitas.com/health',
    expected: 200,
  },
  {
    name: 'MinIO Server Info (should be blocked)',
    url: 'http://storage.berkomunitas.com',
    expected: [403, 404], // MinIO root should not be accessible
  },
  {
    name: 'Test File #1 (migrated_138)',
    url: 'http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_138_1770445648530.jpg',
    expected: 200,
  },
  {
    name: 'Test File #2 (migrated_222)',
    url: 'http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_222_1770445649339.jpg',
    expected: 200,
  },
  {
    name: 'Test File #3 (migrated_11)',
    url: 'http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_11_1770445654888.png',
    expected: 200,
  },
  {
    name: 'Direct MinIO API (should timeout or refuse)',
    url: 'http://213.190.4.159:9000/berkomunitas/profile-pictures/migrated_138_1770445648530.jpg',
    expected: [200, 403, 'TIMEOUT'],
    note: 'Port 9000 may not be exposed publicly (expected)',
  },
];

function testUrl(test) {
  return new Promise((resolve) => {
    const client = test.url.startsWith('https') ? https : http;
    const timeout = 5000;

    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    const request = client.get(test.url, { timeout }, (res) => {
      const statusCode = res.statusCode;
      const headers = res.headers;

      // Collect response data
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 500) {
          // Limit data collection
          res.destroy();
        }
      });

      res.on('end', () => {
        const expectedCodes = Array.isArray(test.expected) 
          ? test.expected 
          : [test.expected];

        const success = expectedCodes.includes(statusCode);
        const icon = success ? '✅' : '❌';

        console.log(`   ${icon} Status: ${statusCode}`);
        
        // Show relevant headers
        if (headers['content-type']) {
          console.log(`   📦 Content-Type: ${headers['content-type']}`);
        }
        if (headers['content-length']) {
          console.log(`   📏 Content-Length: ${headers['content-length']} bytes`);
        }
        if (headers['x-minio-error-code']) {
          console.log(`   ⚠️  MinIO Error: ${headers['x-minio-error-code']}`);
        }
        if (headers['x-minio-error-desc']) {
          console.log(`   ℹ️  Description: ${headers['x-minio-error-desc']}`);
        }
        if (headers['server']) {
          console.log(`   🖥️  Server: ${headers['server']}`);
        }
        if (headers['access-control-allow-origin']) {
          console.log(`   🌐 CORS: ${headers['access-control-allow-origin']}`);
        }

        // Show snippet of response for non-image content
        if (statusCode !== 200 && data.length > 0 && data.length < 200) {
          console.log(`   📄 Response: ${data.substring(0, 100)}`);
        }

        if (test.note) {
          console.log(`   💡 Note: ${test.note}`);
        }

        resolve({
          name: test.name,
          url: test.url,
          statusCode,
          success,
          headers,
        });
      });
    });

    request.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      if (test.note) {
        console.log(`   💡 Note: ${test.note}`);
      }
      resolve({
        name: test.name,
        url: test.url,
        error: error.message,
        success: false,
      });
    });

    request.on('timeout', () => {
      request.destroy();
      console.log(`   ⏱️  Timeout (${timeout}ms)`);
      if (test.note) {
        console.log(`   💡 Note: ${test.note}`);
      }
      resolve({
        name: test.name,
        url: test.url,
        timeout: true,
        success: test.expected.includes('TIMEOUT'),
      });
    });
  });
}

async function runDiagnostics() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔬 MinIO Storage Access Diagnostics');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📅 ${new Date().toLocaleString()}`);
  console.log('');

  const results = [];

  for (const test of tests) {
    const result = await testUrl(test);
    results.push(result);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Summary');
  console.log('═══════════════════════════════════════════════════════');

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failedCount}/${results.length}`);

  if (failedCount > 0) {
    console.log('\n🔴 Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}`);
      if (r.statusCode) {
        console.log(`     Status: ${r.statusCode}`);
      }
      if (r.error) {
        console.log(`     Error: ${r.error}`);
      }
    });
  }

  // Diagnosis
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 Diagnosis');
  console.log('═══════════════════════════════════════════════════════');

  const imageTests = results.filter(r => r.name.includes('Test File'));
  const allImagesFailed = imageTests.every(r => !r.success);
  const someImagesFailed = imageTests.some(r => !r.success) && !allImagesFailed;

  if (allImagesFailed) {
    console.log('❌ ALL IMAGE FILES FAILED');
    console.log('\nPossible causes:');
    console.log('1. Bucket policy is NOT public');
    console.log('   Run on server: docker exec drw-minio mc anonymous get local/berkomunitas');
    console.log('   Fix: docker exec drw-minio mc anonymous set download local/berkomunitas');
    console.log('');
    console.log('2. Files were not actually saved to MinIO');
    console.log('   Run on server: docker exec drw-minio mc ls local/berkomunitas/profile-pictures/');
    console.log('');
    console.log('3. Nginx rewrite rule is incorrect');
    console.log('   Check: docker exec nginx-proxy cat /etc/nginx/conf.d/storage.berkomunitas.com.conf');
    console.log('');
    console.log('4. Path mismatch (files saved to wrong location)');
    console.log('   Compare upload Key vs actual MinIO path');
  } else if (someImagesFailed) {
    console.log('⚠️  SOME IMAGE FILES FAILED');
    console.log('\nThis is normal if those specific files were not uploaded successfully.');
    console.log('Check migration logs for failed uploads.');
  } else {
    console.log('✅ ALL IMAGE FILES ACCESSIBLE');
    console.log('\nYour MinIO storage is working correctly!');
    console.log('Images should display properly in the application.');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('💡 Next Steps');
  console.log('═══════════════════════════════════════════════════════');

  if (allImagesFailed) {
    console.log('1. SSH to server: ssh root@213.190.4.159');
    console.log('2. Run verification script: bash scripts/verify-minio-setup.sh');
    console.log('3. Or run commands above to diagnose issue');
  } else {
    console.log('1. Test upload new image via application');
    console.log('2. Verify it displays correctly');
    console.log('3. Monitor for any errors in production');
    console.log('4. Consider migrating remaining Cloudinary images');
  }

  console.log('');
}

// Run diagnostics
runDiagnostics().catch(console.error);
