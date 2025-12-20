#!/usr/bin/env node

/**
 * Setup script for ElevenLabs MCP configuration
 * 
 * This script helps set up the MCP configuration by:
 * 1. Reading ELEVENLABS_API_KEY from environment variables
 * 2. Creating .cursor/mcp.json with the API key
 * 
 * Usage:
 *   node scripts/setup-mcp.js
 * 
 * Or with explicit API key:
 *   ELEVENLABS_API_KEY=your_key_here node scripts/setup-mcp.js
 */

const fs = require('fs');
const path = require('path');

const MCP_CONFIG_PATH = path.join(__dirname, '..', '.cursor', 'mcp.json');
const MCP_EXAMPLE_PATH = path.join(__dirname, '..', '.cursor', 'mcp.json.example');
const CURSOR_DIR = path.join(__dirname, '..', '.cursor');

// Ensure .cursor directory exists
if (!fs.existsSync(CURSOR_DIR)) {
  fs.mkdirSync(CURSOR_DIR, { recursive: true });
}

// Get API key from environment
const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey || apiKey === '' || apiKey.includes('<') || apiKey.includes('your-')) {
  console.error('❌ ERROR: ELEVENLABS_API_KEY not set or invalid');
  console.error('');
  console.error('Please set ELEVENLABS_API_KEY environment variable:');
  console.error('  Windows PowerShell: $env:ELEVENLABS_API_KEY="your_key_here"');
  console.error('  Windows CMD: set ELEVENLABS_API_KEY=your_key_here');
  console.error('  macOS/Linux: export ELEVENLABS_API_KEY=your_key_here');
  console.error('');
  console.error('Or run: ELEVENLABS_API_KEY=your_key_here node scripts/setup-mcp.js');
  console.error('');
  console.error('Get your API key from: https://elevenlabs.io/app/settings/api-keys');
  process.exit(1);
}

// MCP configuration template
const mcpConfig = {
  mcpServers: {
    elevenlabs: {
      description: "Official ElevenLabs MCP for text-to-speech, voice cloning, audio processing, and transcription. Generate AI voices, design custom voices, isolate audio, create sound effects, and more.",
      command: "uvx",
      args: ["elevenlabs-mcp"],
      env: {
        ELEVENLABS_API_KEY: apiKey,
        ELEVENLABS_MCP_BASE_PATH: "~/Desktop",
        ELEVENLABS_MCP_OUTPUT_MODE: "files"
      }
    }
  }
};

try {
  // Write MCP configuration
  fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(mcpConfig, null, 2), 'utf8');
  console.log('✅ MCP configuration created successfully!');
  console.log(`   Location: ${MCP_CONFIG_PATH}`);
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Restart Cursor to load the MCP server');
  console.log('   2. Verify by asking Cursor: "List my ElevenLabs agents"');
  console.log('');
  console.log('⚠️  Note: This file is in .gitignore and will not be committed.');
} catch (error) {
  console.error('❌ ERROR: Failed to create MCP configuration:', error.message);
  process.exit(1);
}
