#!/usr/bin/env ts-node

/**
 * Test script to verify ElevenLabs API connection
 * Usage: npm run test:elevenlabs (or ts-node server/scripts/testElevenLabs.ts)
 */

import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY;

async function testConnection() {
  console.log('\n🔍 Testing ElevenLabs API Connection...\n');

  // Check if API key is set
  if (!API_KEY || API_KEY === '' || API_KEY.includes('your_') || API_KEY.includes('placeholder') || API_KEY === 'PLACEHOLDER_FOR_TESTING') {
    console.error('❌ ERROR: ELEVENLABS_API_KEY not configured or using placeholder');
    console.error('   Please set a valid ELEVENLABS_API_KEY in your .env file');
    console.error('   Get your API key from: https://elevenlabs.io/app/settings/api-keys\n');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`   Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

  // Test 1: Get User Info (validates API key)
  console.log('📡 Test 1: Validating API Key (GET /user)...');
  try {
    const userResponse = await axios.get(`${API_BASE}/user`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 10000,
    });
    console.log('✅ API Key is valid!');
    console.log(`   Subscription: ${userResponse.data.subscription?.tier || 'Unknown'}`);
    console.log(`   Characters used: ${userResponse.data.subscription?.character_count || 0}`);
    console.log(`   Characters limit: ${userResponse.data.subscription?.character_limit || 0}\n`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error('❌ API Key is invalid or expired');
        console.error('   Please check your API key at: https://elevenlabs.io/app/settings/api-keys\n');
      } else if (error.response?.status === 429) {
        console.error('⚠️  Rate limit exceeded. Please try again later.\n');
      } else {
        console.error(`❌ Error: ${error.response?.status} ${error.response?.statusText}`);
        console.error(`   Message: ${error.response?.data?.detail?.message || error.message}\n`);
      }
    } else {
      console.error('❌ Network error:', error);
    }
    process.exit(1);
  }

  // Test 2: Get Voices
  console.log('📡 Test 2: Fetching available voices (GET /voices)...');
  try {
    const voicesResponse = await axios.get(`${API_BASE}/voices`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 10000,
    });
    const voices = voicesResponse.data.voices || [];
    console.log(`✅ Successfully fetched ${voices.length} voices`);
    console.log('   Sample voices:');
    voices.slice(0, 5).forEach((voice: any) => {
      console.log(`   - ${voice.name} (${voice.voice_id})`);
    });
    console.log('');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Error fetching voices: ${error.response?.status} ${error.response?.statusText}`);
      console.error(`   Message: ${error.response?.data?.detail?.message || error.message}\n`);
    } else {
      console.error('❌ Network error:', error);
    }
    process.exit(1);
  }

  // Test 3: Test TTS Generation (small test)
  console.log('📡 Test 3: Testing Text-to-Speech generation (POST /text-to-speech)...');
  try {
    const testText = 'Hallo, dies ist ein Test der ElevenLabs Verbindung.';
    const testVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice
    
    const ttsResponse = await axios.post(
      `${API_BASE}/text-to-speech/${testVoiceId}`,
      {
        text: testText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    const audioSize = (ttsResponse.data as ArrayBuffer).byteLength;
    console.log(`✅ TTS generation successful!`);
    console.log(`   Generated audio size: ${(audioSize / 1024).toFixed(2)} KB`);
    console.log(`   Text: "${testText}"`);
    console.log(`   Voice: Rachel (${testVoiceId})\n`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error('❌ API Key is invalid for TTS generation');
      } else if (error.response?.status === 429) {
        console.error('⚠️  Rate limit exceeded for TTS generation');
      } else if (error.response?.status === 400) {
        console.error('❌ Invalid request parameters');
        console.error(`   Message: ${JSON.stringify(error.response.data)}\n`);
      } else {
        console.error(`❌ Error: ${error.response?.status} ${error.response?.statusText}`);
        console.error(`   Message: ${error.response?.data?.detail?.message || error.message}\n`);
      }
    } else {
      console.error('❌ Network error:', error);
    }
    process.exit(1);
  }

  // All tests passed
  console.log('🎉 All tests passed! ElevenLabs connection is working correctly.\n');
  process.exit(0);
}

// Run tests
testConnection().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

