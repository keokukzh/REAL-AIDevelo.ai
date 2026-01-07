import fs from 'fs';
import path from 'path';

// Define source and destination
// Using absolute paths based on where the script is run (project root expected)
const src = path.join(process.cwd(), 'server', 'db', 'migrations');
const dest = path.join(process.cwd(), 'db', 'migrations');

console.log(`Copying migrations from ${src} to ${dest}...`);

try {
  if (fs.existsSync(src)) {
    // Ensure destination directory exists
    fs.mkdirSync(dest, { recursive: true });

    // Copy recursively
    fs.cpSync(src, dest, { recursive: true });
    console.log('✅ Migrations copied successfully.');
  } else {
    console.warn(`⚠️ Warning: Source migrations directory not found at ${src}. Skipping copy.`);
  }
} catch (error) {
  console.error('❌ Error copying assets:', error);
  process.exit(1);
}
