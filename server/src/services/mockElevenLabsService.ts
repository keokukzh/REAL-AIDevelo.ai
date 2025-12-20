/**
 * Mock ElevenLabs Service
 * 
 * Provides mock implementations for development/testing when ELEVENLABS_MOCK_MODE=true
 * Prevents real API calls and costs during development
 */

import { config } from '../config/env';

const MOCK_MODE = process.env.ELEVENLABS_MOCK_MODE === 'true';

/**
 * Generate mock audio (sine wave test tone)
 */
function generateMockAudio(durationMs: number = 1000, frequency: number = 440): ArrayBuffer {
  const sampleRate = 44100;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const buffer = new ArrayBuffer(numSamples * 2); // 16-bit PCM = 2 bytes per sample
  const view = new DataView(buffer);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    const int16Sample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(i * 2, int16Sample, true); // little-endian
  }
  
  return buffer;
}

/**
 * Create mock WebSocket URL for browser tests
 */
export function getMockWebSocketUrl(agentId: string): string {
  if (!MOCK_MODE) {
    throw new Error('Mock mode not enabled');
  }
  
  // Return a WebSocket URL that points to a mock server
  // In browser, this will be handled by the mock WebSocket client
  return `ws://localhost:5000/mock/elevenlabs/ws?agent_id=${encodeURIComponent(agentId)}`;
}

/**
 * Generate mock TwiML for register-call
 */
export function getMockTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This is a mock call. ElevenLabs Mock Mode is enabled.</Say>
  <Hangup />
</Response>`;
}

/**
 * Check if mock mode is enabled
 */
export function isMockModeEnabled(): boolean {
  return MOCK_MODE;
}

/**
 * Generate mock audio blob for testing
 */
export function generateMockAudioBlob(durationMs: number = 1000): Blob {
  const audioBuffer = generateMockAudio(durationMs);
  return new Blob([audioBuffer], { type: 'audio/pcm' });
}

/**
 * Mock agent verification (always returns success in mock mode)
 */
export function mockAgentVerification(agentId: string): { verified: boolean; name: string } {
  return {
    verified: true,
    name: `Mock Agent (${agentId})`,
  };
}
