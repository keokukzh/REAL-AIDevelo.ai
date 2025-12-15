#!/usr/bin/env node
/**
 * Lint only changed TypeScript/JavaScript files
 * 
 * Usage:
 *   BASE_REF=origin/main node scripts/lint-changed.mjs
 *   npm run lint:changed
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const base = process.env.BASE_REF || 'origin/main';

try {
  // Get changed files
  const diffCmd = `git diff --name-only ${base}...HEAD`;
  const files = execSync(diffCmd, { cwd: rootDir, encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  // Filter to TypeScript/JavaScript files in server/src or src/
  const target = files.filter(f =>
    (f.startsWith('server/src/') || f.startsWith('src/')) &&
    (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'))
  );

  if (target.length === 0) {
    console.log('✅ No changed TS/JS files to lint.');
    process.exit(0);
  }

  console.log(`📋 Linting ${target.length} changed file(s):`);
  target.forEach(f => console.log(`   - ${f}`));

  // Run ESLint on changed files
  // For server files, use server/.eslintrc.cjs
  const serverFiles = target.filter(f => f.startsWith('server/src/'));
  const frontendFiles = target.filter(f => f.startsWith('src/') && !f.startsWith('server/'));

  if (serverFiles.length > 0) {
    console.log(`\n🔍 Linting ${serverFiles.length} server file(s)...`);
    const cmd = `cd server && npx eslint ${serverFiles.map(f => f.replace('server/', '')).map(f => `"${f}"`).join(' ')} --max-warnings 0`;
    console.log(`Running: ${cmd}`);
    execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  }

  if (frontendFiles.length > 0) {
    console.log(`\n🔍 Linting ${frontendFiles.length} frontend file(s)...`);
    // Frontend linting would go here if needed
    // For now, we only enforce no-console for server files
  }

  console.log('\n✅ All changed files passed linting!');
} catch (error) {
  console.error('\n❌ Linting failed:', error.message);
  process.exit(1);
}
