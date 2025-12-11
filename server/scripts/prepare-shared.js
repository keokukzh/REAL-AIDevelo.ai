const fs = require('fs');
const path = require('path');

// Copy shared folder into src/shared so it's under rootDir for TypeScript compilation
const sharedSource = path.join(__dirname, '../../shared');
const sharedTarget = path.join(__dirname, '../src/shared');

if (fs.existsSync(sharedSource)) {
  // Remove existing if present (for clean rebuilds)
  if (fs.existsSync(sharedTarget)) {
    fs.rmSync(sharedTarget, { recursive: true, force: true });
  }
  // Copy shared folder (symlinks don't work well cross-platform)
  fs.cpSync(sharedSource, sharedTarget, { recursive: true });
  console.log('✓ Copied shared types to src/shared');
}

