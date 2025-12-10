import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

console.log('🔍 Validating migrations...\n');

// Check if migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  console.error('❌ Migrations directory not found:', MIGRATIONS_DIR);
  process.exit(1);
}

// Read all migration files
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`✅ Found ${files.length} migration files:\n`);

let allValid = true;

for (const file of files) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Basic validation
  const hasCreateTable = content.includes('CREATE TABLE');
  const hasIfNotExists = content.includes('IF NOT EXISTS');
  
  console.log(`  📄 ${file}`);
  console.log(`     Size: ${content.length} bytes`);
  console.log(`     Has CREATE TABLE: ${hasCreateTable ? '✅' : '❌'}`);
  console.log(`     Has IF NOT EXISTS: ${hasIfNotExists ? '✅' : '❌'}`);
  
  if (!hasCreateTable) {
    console.log(`     ⚠️  Warning: No CREATE TABLE statement found`);
    allValid = false;
  }
  
  console.log('');
}

// Expected migrations
const expectedMigrations = [
  '001_create_users_table.sql',
  '002_create_agents_table.sql',
  '003_create_purchases_table.sql',
  '004_create_rag_documents_table.sql',
  '005_create_call_history_table.sql'
];

console.log('📋 Expected migrations:');
for (const expected of expectedMigrations) {
  const exists = files.includes(expected);
  console.log(`  ${exists ? '✅' : '❌'} ${expected}`);
  if (!exists) allValid = false;
}

console.log('\n' + '='.repeat(50));
if (allValid && files.length === expectedMigrations.length) {
  console.log('✅ All migrations are valid and present!');
  console.log('\n🚀 Ready to run: npm run migrate');
  process.exit(0);
} else {
  console.log('❌ Some migrations are missing or invalid');
  process.exit(1);
}

