const fs = require('fs');
const path = require('path');

// Ensure shared folder is accessible at server/shared for consistent import paths
const sharedSource = path.join(__dirname, '../../shared');
const sharedTarget = path.join(__dirname, '../shared');

if (fs.existsSync(sharedSource) && !fs.existsSync(sharedTarget)) {
  // Copy shared folder (symlinks don't work well cross-platform)
  fs.cpSync(sharedSource, sharedTarget, { recursive: true });
  console.log('✓ Copied shared types to server/shared');
}

