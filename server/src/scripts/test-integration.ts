#!/usr/bin/env tsx
/**
 * End-to-End Integration Test Script
 * Tests Knowledge Base, RAG, Agent, ElevenLabs, and Twilio integration
 * 
 * Usage:
 *   tsx server/src/scripts/test-integration.ts
 * 
 * Or with environment variables:
 *   API_URL=http://localhost:5000/api tsx server/src/scripts/test-integration.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { config } from '../config/env';

// Load environment variables
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_LOCATION_ID = process.env.TEST_LOCATION_ID || '';
const TEST_AGENT_ID = process.env.TEST_AGENT_ID || '';
const TEST_QUERY = process.env.TEST_QUERY || 'Was sind eure Öffnungszeiten?';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${name}`, color);
  if (details) {
    console.log(`    ${details}`);
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function testKnowledgeBaseList(): Promise<TestResult> {
  try {
    // Note: This requires authentication in real scenario
    // For testing, you may need to provide auth token
    const response = await axios.get(`${API_URL}/rag/documents`, {
      validateStatus: () => true, // Don't throw on any status
    });

    if (response.status === 200 && response.data?.success) {
      return {
        name: 'Knowledge Base List',
        passed: true,
        details: `Found ${response.data.data?.items?.length || 0} documents`,
      };
    } else if (response.status === 401) {
      return {
        name: 'Knowledge Base List',
        passed: false,
        details: 'Authentication required (expected in production)',
      };
    } else {
      return {
        name: 'Knowledge Base List',
        passed: false,
        details: `Status: ${response.status}, Error: ${response.data?.error || 'Unknown'}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'Knowledge Base List',
      passed: false,
      error: error.message,
    };
  }
}

async function testRAGQuery(locationId: string, query: string): Promise<TestResult> {
  try {
    const response = await axios.post(
      `${API_URL}/dev/rag/query`,
      { query },
      {
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      const data = response.data.data;
      return {
        name: 'RAG Query',
        passed: true,
        details: `Results: ${data.resultCount}, Injected: ${data.injectedChars} chars`,
      };
    } else {
      return {
        name: 'RAG Query',
        passed: false,
        details: `Status: ${response.status}, Error: ${response.data?.error || 'Unknown'}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'RAG Query',
      passed: false,
      error: error.message,
    };
  }
}

async function testAgentWithRAG(locationId: string, query: string): Promise<TestResult> {
  try {
    const response = await axios.post(
      `${API_URL}/dev/rag/test-agent`,
      { query, customerId: locationId },
      {
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      const data = response.data.data;
      return {
        name: 'Agent with RAG',
        passed: true,
        details: `RAG enabled: ${data.rag?.enabled}, Results: ${data.rag?.resultCount || 0}, Response length: ${data.response?.length || 0}`,
      };
    } else {
      return {
        name: 'Agent with RAG',
        passed: false,
        details: `Status: ${response.status}, Error: ${response.data?.error || 'Unknown'}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'Agent with RAG',
      passed: false,
      error: error.message,
    };
  }
}

async function testElevenLabsConnection(agentId?: string, locationId?: string): Promise<TestResult> {
  try {
    const response = await axios.post(
      `${API_URL}/dev/elevenlabs/test-connection`,
      { agentId, locationId },
      {
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      const data = response.data.data;
      return {
        name: 'ElevenLabs Connection',
        passed: true,
        details: `Agent ID: ${data.agentId}, Exists: ${data.agentExists}, Name: ${data.agentName || 'N/A'}`,
      };
    } else {
      return {
        name: 'ElevenLabs Connection',
        passed: false,
        details: `Status: ${response.status}, Error: ${response.data?.error || 'Unknown'}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'ElevenLabs Connection',
      passed: false,
      error: error.message,
    };
  }
}

async function testElevenLabsRAG(locationId: string, query: string, agentId?: string): Promise<TestResult> {
  try {
    const response = await axios.post(
      `${API_URL}/dev/elevenlabs/test-rag`,
      { locationId, query, agentId },
      {
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      const data = response.data.data;
      return {
        name: 'ElevenLabs RAG Integration',
        passed: true,
        details: `RAG enabled: ${data.rag?.enabled}, Results: ${data.rag?.resultCount || 0}, Agent: ${data.agent?.exists ? 'Connected' : 'Not tested'}`,
      };
    } else {
      return {
        name: 'ElevenLabs RAG Integration',
        passed: false,
        details: `Status: ${response.status}, Error: ${response.data?.error || 'Unknown'}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'ElevenLabs RAG Integration',
      passed: false,
      error: error.message,
    };
  }
}

async function testTwilioWebhook(callSid: string, from: string, to: string, locationId?: string): Promise<TestResult> {
  try {
    const response = await axios.post(
      `${API_URL}/dev/twilio/test-webhook`,
      { callSid, from, to, locationId },
      {
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      const data = response.data.data;
      return {
        name: 'Twilio Webhook',
        passed: true,
        details: `Location ID: ${data.locationId || 'Not resolved'}, Agent Config: ${data.agentConfig ? 'Found' : 'Not found'}, Media Streams: ${data.environment.ENABLE_MEDIA_STREAMS ? 'Enabled' : 'Disabled'}`,
      };
    } else {
      return {
        name: 'Twilio Webhook',
        passed: false,
        details: `Status: ${response.status}, Error: ${response.data?.error || 'Unknown'}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'Twilio Webhook',
      passed: false,
      error: error.message,
    };
  }
}

async function testTwilioTwiML(callSid: string, from: string, to: string, locationId?: string): Promise<TestResult> {
  try {
    const params = new URLSearchParams({
      callSid,
      from,
      to,
      ...(locationId && { locationId }),
    });

    const response = await axios.get(
      `${API_URL}/dev/twilio/test-twiml?${params.toString()}`,
      {
        validateStatus: () => true,
        headers: {
          Accept: 'application/xml, text/xml',
        },
      }
    );

    if (response.status === 200 && response.data) {
      const isTwiML = typeof response.data === 'string' && response.data.includes('<Response>');
      return {
        name: 'Twilio TwiML Generation',
        passed: isTwiML,
        details: isTwiML
          ? `TwiML generated (${response.data.length} chars)`
          : 'Response is not valid TwiML',
      };
    } else {
      return {
        name: 'Twilio TwiML Generation',
        passed: false,
        details: `Status: ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'Twilio TwiML Generation',
      passed: false,
      error: error.message,
    };
  }
}

async function checkEnvironmentVariables(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ELEVENLABS_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'PUBLIC_BASE_URL',
  ];

  const optionalVars = [
    'TWILIO_STREAM_TOKEN',
    'ELEVENLABS_AGENT_ID_DEFAULT',
    'QDRANT_URL',
    'OPENAI_API_KEY',
  ];

  logSection('Environment Variables Check');

  for (const varName of requiredVars) {
    const value = process.env[varName];
    results.push({
      name: `Required: ${varName}`,
      passed: !!value && !value.includes('placeholder'),
      details: value ? 'Set' : 'Missing',
    });
  }

  for (const varName of optionalVars) {
    const value = process.env[varName];
    results.push({
      name: `Optional: ${varName}`,
      passed: true, // Optional vars don't fail the test
      details: value ? 'Set' : 'Not set (optional)',
    });
  }

  return results;
}

async function main() {
  log('\n🚀 Starting Integration Tests', 'blue');
  log(`API URL: ${API_URL}\n`, 'yellow');

  const results: TestResult[] = [];

  // 1. Environment Variables Check
  const envResults = await checkEnvironmentVariables();
  results.push(...envResults);
  envResults.forEach((r) => logTest(r.name, r.passed, r.details));

  // 2. Knowledge Base Tests
  logSection('Knowledge Base Tests');
  const kbResult = await testKnowledgeBaseList();
  results.push(kbResult);
  logTest(kbResult.name, kbResult.passed, kbResult.details || kbResult.error);

  // 3. RAG Tests (require locationId)
  if (TEST_LOCATION_ID) {
    logSection('RAG Integration Tests');
    
    const ragQueryResult = await testRAGQuery(TEST_LOCATION_ID, TEST_QUERY);
    results.push(ragQueryResult);
    logTest(ragQueryResult.name, ragQueryResult.passed, ragQueryResult.details || ragQueryResult.error);

    const agentRagResult = await testAgentWithRAG(TEST_LOCATION_ID, TEST_QUERY);
    results.push(agentRagResult);
    logTest(agentRagResult.name, agentRagResult.passed, agentRagResult.details || agentRagResult.error);
  } else {
    log('  ⚠ SKIP: RAG tests require TEST_LOCATION_ID', 'yellow');
  }

  // 4. ElevenLabs Tests
  logSection('ElevenLabs Integration Tests');
  const elevenLabsResult = await testElevenLabsConnection(TEST_AGENT_ID, TEST_LOCATION_ID);
  results.push(elevenLabsResult);
  logTest(elevenLabsResult.name, elevenLabsResult.passed, elevenLabsResult.details || elevenLabsResult.error);

  if (TEST_LOCATION_ID) {
    const elevenLabsRagResult = await testElevenLabsRAG(TEST_LOCATION_ID, TEST_QUERY, TEST_AGENT_ID);
    results.push(elevenLabsRagResult);
    logTest(elevenLabsRagResult.name, elevenLabsRagResult.passed, elevenLabsRagResult.details || elevenLabsRagResult.error);
  }

  // 5. Twilio Tests
  logSection('Twilio Integration Tests');
  const testCallSid = 'CA' + Math.random().toString(36).substring(2, 15);
  const testFrom = '+41791234567';
  const testTo = '+41441234567';

  const twilioWebhookResult = await testTwilioWebhook(testCallSid, testFrom, testTo, TEST_LOCATION_ID);
  results.push(twilioWebhookResult);
  logTest(twilioWebhookResult.name, twilioWebhookResult.passed, twilioWebhookResult.details || twilioWebhookResult.error);

  const twilioTwiMLResult = await testTwilioTwiML(testCallSid, testFrom, testTo, TEST_LOCATION_ID);
  results.push(twilioTwiMLResult);
  logTest(twilioTwiMLResult.name, twilioTwiMLResult.passed, twilioTwiMLResult.details || twilioTwiMLResult.error);

  // Summary
  logSection('Test Summary');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  log(`Total Tests: ${total}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed > 0) {
    log('\nFailed Tests:', 'red');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        log(`  - ${r.name}`, 'red');
        if (r.details) log(`    ${r.details}`, 'yellow');
        if (r.error) log(`    Error: ${r.error}`, 'yellow');
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
