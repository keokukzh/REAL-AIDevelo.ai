/**
 * Script to generate OpenAPI specification file
 * Run: npx ts-node scripts/generate-openapi.ts
 */

import { writeFileSync } from 'fs';
import { swaggerSpec } from '../src/config/swagger';
import path from 'path';

const outputPath = path.join(__dirname, '../openapi.json');

try {
  writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
  console.log(`✅ OpenAPI specification generated: ${outputPath}`);
  console.log(`📄 File size: ${(JSON.stringify(swaggerSpec).length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Error generating OpenAPI specification:', error);
  process.exit(1);
}

