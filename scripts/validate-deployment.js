#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Memastikan semua kode sudah siap untuk deploy ke Vercel
 */

import { promises as fs } from 'fs';
import path from 'path';

const errors = [];
const warnings = [];

// Check 1: Pastikan tidak ada import yang salah
async function checkImports() {
  console.log('🔍 Checking imports...');
  
  const apiFiles = await getJSFiles('./src/app/api');
  const utilFiles = await getJSFiles('./src/utils');
  const libFiles = await getJSFiles('./lib');
  
  const allFiles = [...apiFiles, ...utilFiles, ...libFiles];
  
  for (const file of allFiles) {
    const content = await fs.readFile(file, 'utf-8');
    
    // Check for old import paths
    if (content.includes('@/utils/prisma')) {
      errors.push(`${file}: Uses old import path '@/utils/prisma'`);
    }
    
    // Check for old adminAuth import
    if (content.includes('adminAuth')) {
      warnings.push(`${file}: Still references old adminAuth`);
    }
    
    // Check for user_email usage
    if (content.includes('user_email') && !file.includes('migration')) {
      errors.push(`${file}: Still uses 'user_email' field`);
    }
  }
}

// Check 2: Pastikan environment variables ada
async function checkEnvVariables() {
  console.log('🔍 Checking environment variables...');
  
  try {
    const envExample = await fs.readFile('.env.example', 'utf-8');
    const requiredVars = envExample.match(/^[A-Z_]+=.*/gm) || [];
    
    console.log('Required environment variables:');
    requiredVars.forEach(line => {
      const varName = line.split('=')[0];
      console.log(`  - ${varName}`);
    });
  } catch (error) {
    warnings.push('No .env.example file found');
  }
}

// Check 3: Pastikan Prisma schema konsisten
async function checkPrismaSchema() {
  console.log('🔍 Checking Prisma schema...');
  
  try {
    const schema = await fs.readFile('./prisma/schema.prisma', 'utf-8');
    
    if (schema.includes('clerkId') && !schema.includes('clerk_id')) {
      errors.push('Prisma schema still uses camelCase clerkId instead of clerk_id');
    }
    
    if (schema.includes('user_email') && schema.includes('clerk_id')) {
      warnings.push('Prisma schema has both user_email and clerk_id - make sure migration is planned');
    }
    
    if (!schema.includes('clerk_id')) {
      errors.push('Prisma schema missing clerk_id field');
    }
  } catch (error) {
    errors.push('Could not read Prisma schema file');
  }
}

// Check 4: Pastikan package.json siap untuk Vercel
async function checkPackageJson() {
  console.log('🔍 Checking package.json...');
  
  try {
    const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
    
    if (!packageJson.scripts || !packageJson.scripts.build) {
      errors.push('package.json missing build script');
    }
    
    if (!packageJson.engines || !packageJson.engines.node) {
      warnings.push('package.json missing Node.js engine specification');
    }
    
    // Check critical dependencies
    const criticalDeps = ['@clerk/nextjs', '@prisma/client', 'next'];
    for (const dep of criticalDeps) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        errors.push(`Missing critical dependency: ${dep}`);
      }
    }
  } catch (error) {
    errors.push('Could not read or parse package.json');
  }
}

// Helper function to get JS files recursively
async function getJSFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...await getJSFiles(fullPath));
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist, skip
  }
  
  return files;
}

// Main validation function
async function validate() {
  console.log('🚀 Pre-deployment validation starting...\n');
  
  await checkImports();
  await checkEnvVariables();
  await checkPrismaSchema();
  await checkPackageJson();
  
  console.log('\n📋 Validation Results:');
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (must fix before deploy):');
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended to fix):');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All checks passed! Ready to deploy to Vercel.');
  } else if (errors.length === 0) {
    console.log('\n✅ No critical errors found. Deployment should work, but consider fixing warnings.');
  } else {
    console.log('\n❌ Critical errors found. Please fix before deploying.');
    process.exit(1);
  }
}

// Run validation
validate().catch(console.error);
