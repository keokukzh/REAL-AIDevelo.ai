#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes Vite build output to identify large dependencies and optimization opportunities
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.json');

console.log('📦 Bundle Analysis Tool\n');

// Check if dist directory exists
if (!existsSync(DIST_DIR)) {
  console.log('❌ dist/ directory not found. Building first...\n');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Analyze chunk sizes
console.log('📊 Analyzing chunk sizes...\n');

try {
  // Read dist directory structure
  const { readdirSync, statSync } = await import('fs');
  const files = readdirSync(DIST_DIR);
  
  const chunks = files
    .filter(file => file.endsWith('.js') || file.endsWith('.css'))
    .map(file => {
      const filePath = join(DIST_DIR, file);
      const stats = statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      return {
        name: file,
        size: stats.size,
        sizeKB: parseFloat(sizeKB),
        sizeMB: parseFloat(sizeMB),
      };
    })
    .sort((a, b) => b.size - a.size);

  console.log('📦 Chunk Sizes:\n');
  console.log('File'.padEnd(50) + 'Size'.padEnd(15) + 'Status');
  console.log('-'.repeat(80));
  
  chunks.forEach(chunk => {
    const status = chunk.sizeKB > 500 
      ? '⚠️  LARGE (>500KB)' 
      : chunk.sizeKB > 250 
        ? '⚠️  Medium (>250KB)' 
        : '✅ OK';
    console.log(
      chunk.name.padEnd(50) + 
      `${chunk.sizeKB} KB (${chunk.sizeMB} MB)`.padEnd(15) + 
      status
    );
  });

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  console.log('\n' + '-'.repeat(80));
  console.log(`Total: ${totalSizeKB} KB (${totalSizeMB} MB)`);
  
  const largeChunks = chunks.filter(c => c.sizeKB > 500);
  if (largeChunks.length > 0) {
    console.log('\n⚠️  Large chunks detected (>500KB):');
    largeChunks.forEach(chunk => {
      console.log(`  - ${chunk.name}: ${chunk.sizeKB} KB`);
    });
    console.log('\n💡 Recommendations:');
    console.log('  1. Split large dependencies into separate chunks');
    console.log('  2. Use dynamic imports for heavy components');
    console.log('  3. Consider code splitting by route');
    console.log('  4. Remove unused dependencies');
  }

  // Check for common large dependencies
  console.log('\n🔍 Checking for common large dependencies...\n');
  const largeDeps = [
    'framer-motion',
    'recharts',
    'three',
    '@react-three',
    '@lottiefiles',
  ];

  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  largeDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`  ⚠️  ${dep} is installed (can be large)`);
    }
  });

  console.log('\n✅ Bundle analysis complete!\n');

} catch (error) {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
}
