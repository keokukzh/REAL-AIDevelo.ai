#!/usr/bin/env node
/**
 * Check for double /api/ prefix in apiClient calls
 * 
 * Usage:
 *   node scripts/check-api-prefix.mjs
 *   npm run lint:api-prefix
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const issues = [];

/**
 * Check a file for double /api/ prefix patterns
 */
function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Pattern 1: apiClient.get('/api/...')
    const pattern1 = /apiClient\.(get|post|put|patch|delete)\(['"]\/api\//;
    if (pattern1.test(line)) {
      issues.push({
        file: filePath.replace(rootDir + '\\', ''),
        line: lineNum,
        code: line.trim(),
        issue: 'Double /api/ prefix detected in apiClient call',
      });
    }
    
    // Pattern 2: apiClient.get(`/api/...`)
    const pattern2 = /apiClient\.(get|post|put|patch|delete)\(`\/api\//;
    if (pattern2.test(line)) {
      issues.push({
        file: filePath.replace(rootDir + '\\', ''),
        line: lineNum,
        code: line.trim(),
        issue: 'Double /api/ prefix detected in apiClient call (template literal)',
      });
    }
  });
}

/**
 * Recursively check TypeScript files in src/hooks
 */
function checkDirectory(dir) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      checkDirectory(fullPath);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      checkFile(fullPath);
    }
  }
}

try {
  const hooksDir = join(rootDir, 'src', 'hooks');
  checkDirectory(hooksDir);
  
  if (issues.length === 0) {
    console.log('✅ No double /api/ prefix issues found in apiClient calls.');
    process.exit(0);
  } else {
    console.error(`\n❌ Found ${issues.length} issue(s) with double /api/ prefix:\n`);
    issues.forEach((issue) => {
      console.error(`  ${issue.file}:${issue.line}`);
      console.error(`    ${issue.issue}`);
      console.error(`    Code: ${issue.code}`);
      console.error('');
    });
    console.error('Fix: Remove /api/ prefix from apiClient calls (apiClient already uses /api as base URL)');
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking files:', error.message);
  process.exit(1);
}
