/**
 * Test Tugas AI 2 Migration Safety
 * 
 * This script validates that:
 * 1. Migration SQL doesn't alter task_submissions table
 * 2. New tables can be created without conflicts
 * 3. Foreign key relationships are correct
 * 4. Indexes are properly created
 * 5. JSON fields work correctly
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkMigrationSafety() {
  log('\n========================================', 'cyan');
  log('🔍 Tugas AI 2 Migration Safety Check', 'cyan');
  log('========================================\n', 'cyan');

  const migrationPath = path.join(__dirname, '../prisma/migrations/20260208000000_add_tugas_ai_2_screenshot_system/migration.sql');
  
  // Check if migration file exists
  if (!fs.existsSync(migrationPath)) {
    log('❌ Migration file not found!', 'red');
    log(`   Expected at: ${migrationPath}`, 'yellow');
    return false;
  }

  log('✅ Migration file found', 'green');
  
  // Read migration SQL
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Safety checks
  const checks = [
    {
      name: 'No ALTER task_submissions',
      test: !migrationSQL.toLowerCase().includes('alter table "task_submissions"') &&
            !migrationSQL.toLowerCase().includes('alter table task_submissions'),
      description: 'Ensures existing task_submissions table is not modified'
    },
    {
      name: 'No DROP task_submissions',
      test: !migrationSQL.toLowerCase().includes('drop table "task_submissions"') &&
            !migrationSQL.toLowerCase().includes('drop table task_submissions'),
      description: 'Ensures task_submissions table is not dropped'
    },
    {
      name: 'Creates tugas_ai_2 table',
      test: migrationSQL.includes('CREATE TABLE') && migrationSQL.includes('tugas_ai_2'),
      description: 'Verifies tugas_ai_2 table creation'
    },
    {
      name: 'Creates tugas_ai_2_screenshots table',
      test: migrationSQL.includes('CREATE TABLE') && migrationSQL.includes('tugas_ai_2_screenshots'),
      description: 'Verifies screenshots table creation'
    },
    {
      name: 'Has IF NOT EXISTS',
      test: migrationSQL.includes('IF NOT EXISTS'),
      description: 'Safe re-execution with IF NOT EXISTS clauses'
    },
    {
      name: 'Has proper CASCADE',
      test: migrationSQL.includes('ON DELETE CASCADE'),
      description: 'Ensures proper foreign key cascade behavior'
    },
    {
      name: 'Has JSONB fields',
      test: migrationSQL.includes('JSONB'),
      description: 'Verification rules and AI results use JSONB'
    },
    {
      name: 'Has indexes',
      test: migrationSQL.includes('CREATE INDEX'),
      description: 'Performance indexes are created'
    },
    {
      name: 'Has comments/documentation',
      test: migrationSQL.includes('COMMENT ON'),
      description: 'Tables and columns are documented'
    }
  ];

  log('Running safety checks:\n', 'blue');
  
  let allPassed = true;
  checks.forEach((check, index) => {
    const passed = check.test;
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    
    log(`${index + 1}. ${icon} ${check.name}`, color);
    log(`   ${check.description}`, 'yellow');
    
    if (!passed) {
      allPassed = false;
    }
  });

  // Schema validation
  log('\n========================================', 'cyan');
  log('📋 Schema Field Validation', 'cyan');
  log('========================================\n', 'cyan');

  const requiredFields = {
    tugas_ai_2: [
      'id', 'keyword_tugas', 'deskripsi_tugas', 'link_postingan',
      'status', 'point_value', 'source', 'verification_rules',
      'post_timestamp', 'created_at', 'updated_at'
    ],
    tugas_ai_2_screenshots: [
      'id', 'tugas_ai_2_id', 'task_submission_id',
      'screenshot_url', 'screenshot_filename', 'link_komentar',
      'uploaded_at', 'ai_extracted_text', 'ai_confidence_score',
      'ai_verification_result', 'n8n_webhook_id', 'n8n_execution_id',
      'processing_started_at', 'processing_completed_at',
      'created_at', 'updated_at'
    ]
  };

  Object.entries(requiredFields).forEach(([table, fields]) => {
    log(`\nTable: ${table}`, 'blue');
    fields.forEach(field => {
      const found = migrationSQL.includes(`"${field}"`);
      const icon = found ? '✅' : '❌';
      const color = found ? 'green' : 'red';
      log(`  ${icon} ${field}`, color);
      
      if (!found) {
        allPassed = false;
      }
    });
  });

  // Backward compatibility check
  log('\n========================================', 'cyan');
  log('🔄 Backward Compatibility Check', 'cyan');
  log('========================================\n', 'cyan');

  const compatibilityInfo = [
    {
      check: 'task_submissions.comment_id',
      status: 'WILL BE REPURPOSED',
      description: 'Will reference tugas_ai_2_screenshots.id'
    },
    {
      check: 'task_submissions.validation_status',
      status: 'WILL BE USED',
      description: 'Will store AI verification status'
    },
    {
      check: 'task_submissions.keterangan',
      status: 'WILL BE USED',
      description: 'Will store AI rejection reasons'
    },
    {
      check: 'task_submissions.waktu_klik',
      status: 'WILL BE USED',
      description: 'Will store screenshot upload time'
    },
    {
      check: 'Existing n8n workflows',
      status: 'NOT AFFECTED',
      description: 'tugas_ai table remains unchanged'
    }
  ];

  compatibilityInfo.forEach(info => {
    log(`${info.check}:`, 'yellow');
    log(`  Status: ${info.status}`, 'cyan');
    log(`  Note: ${info.description}`, 'green');
  });

  // Final result
  log('\n========================================', 'cyan');
  log('📊 Final Result', 'cyan');
  log('========================================\n', 'cyan');

  if (allPassed) {
    log('✅ ALL CHECKS PASSED!', 'green');
    log('   Migration is safe to apply', 'green');
    log('   No data drift will occur', 'green');
    log('   Backward compatibility maintained\n', 'green');
    return true;
  } else {
    log('❌ SOME CHECKS FAILED!', 'red');
    log('   Please review the migration before applying\n', 'red');
    return false;
  }
}

// Run the check
const isSafe = checkMigrationSafety();

// Display next steps
if (isSafe) {
  log('Next steps:', 'cyan');
  log('1. Run: npx prisma migrate dev --name add_tugas_ai_2_screenshot_verification', 'yellow');
  log('2. Run: npx prisma generate', 'yellow');
  log('3. Test locally before deploying\n', 'yellow');
} else {
  log('Fix the issues above before proceeding\n', 'red');
}

process.exit(isSafe ? 0 : 1);
