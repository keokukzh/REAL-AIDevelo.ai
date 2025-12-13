# Frontend Integration Guide - ElevenLabs Real-Time Voice Streaming

## Overview

This guide covers implementing the frontend WebSocket client for ElevenLabs Conversational API streaming, enabling real-time voice interactions with the AI agent.

---

## 1. Architecture

### Data Flow
```
User speaks into microphone
    ↓
getUserMedia() → AudioContext → WebSocket binary frame
    ↓
Backend receives audio → queries RAG → calls LLM → TTS
    ↓
WebSocket message: { type: 'audio_out', audio: base64 }
    ↓
Decode audio → play via AudioContext
```

### WebSocket Connection Flow
```
1. Frontend: Call POST /api/voice-agent/elevenlabs-stream-token
2. Backend: Returns { token: "base64_config", expiresIn: 3600 }
3. Frontend: Connect to wss://api.elevenlabs.io/v1/convai?token={token}
4. Server: Receives & forwards messages to ElevenLabs
5. Bidirectional: Audio/text flows both directions in real-time
```

---

## 2. Prerequisites

### Required Permissions
- Microphone access (`getUserMedia` permission)
- WebAudio API support (all modern browsers)

### Browser Support
- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile: iOS Safari 14.5+, Android Chrome

### Dependencies (Optional but Recommended)
```json
{
  "dependencies": {
    "wavesurfer.js": "^7.0.0",  // For visualization
    "events": "^3.3.0"           // For TypeScript event emitters
  }
}
```

---

## 3. Implementation Steps

### Step 1: Create Hook - `useElevenLabsStreaming.ts`

```typescript
// src/hooks/useElevenLabsStreaming.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { apiRequest } from '../services/api';

interface StreamConfig {
  customerId: string;
  agentId: string;
  voiceId?: string;
  duration?: number;
}

interface StreamMessage {
  type: 'conversation_initiation' | 'audio_out' | 'user_transcript' | 'server_mid' | 'client_mid';
  [key: string]: any;
}

export function useElevenLabsStreaming(config: StreamConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Get WebSocket token from backend
  const getStreamToken = useCallback(async () => {
    try {
      const response = await apiRequest('POST', '/voice-agent/elevenlabs-stream-token', {
        customerId: config.customerId,
        agentId: config.agentId,
        voiceId: config.voiceId,
        duration: config.duration || 3600,
      });
      return response.data.token;
    } catch (err) {
      throw new Error(`Failed to get stream token: ${err}`);
    }
  }, [config]);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    try {
      setError(null);
      const token = await getStreamToken();
      
      // Connect to ElevenLabs WebSocket
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/convai?token=${token}`
      );
      
      ws.onopen = () => {
        console.log('[ElevenLabs] WebSocket connected');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          handleAudioMessage(event.data);
        } else {
          try {
            const message = JSON.parse(event.data) as StreamMessage;
            handleMessage(message);
          } catch (err) {
            console.error('[ElevenLabs] Failed to parse message:', err);
          }
        }
      };
      
      ws.onerror = (event) => {
        console.error('[ElevenLabs] WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('[ElevenLabs] WebSocket closed');
        setIsConnected(false);
        setIsListening(false);
      };
      
      wsRef.current = ws;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [getStreamToken]);

  // Handle incoming audio from ElevenLabs
  const handleAudioMessage = useCallback((audioBlob: Blob) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const audioContext = audioContextRef.current;
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Play audio
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
      } catch (err) {
        console.error('[ElevenLabs] Failed to play audio:', err);
      }
    };
    
    reader.readAsArrayBuffer(audioBlob);
  }, []);

  // Handle text messages from ElevenLabs
  const handleMessage = useCallback((message: StreamMessage) => {
    switch (message.type) {
      case 'conversation_initiation':
        console.log('[ElevenLabs] Conversation initialized');
        break;
      
      case 'user_transcript':
        setTranscript(message.transcript || '');
        break;
      
      case 'server_mid':
        console.log('[ElevenLabs] Server MID:', message.mid);
        break;
      
      default:
        console.log('[ElevenLabs] Message:', message.type);
    }
  }, []);

  // Start microphone input
  const startListening = useCallback(async () => {
    try {
      setError(null);
      
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }
      
      const audioContext = audioContextRef.current;
      const mediaStream = mediaStreamRef.current;
      
      // Create audio processing chain
      micStreamRef.current = audioContext.createMediaStreamSource(mediaStream);
      
      // Create processor for microphone input
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Send audio to WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Convert to base64 for transmission
          const audioData = Array.from(inputData);
          wsRef.current.send(
            JSON.stringify({
              type: 'user_audio',
              audio: btoa(String.fromCharCode.apply(null, audioData as any)),
            })
          );
        }
      };
      
      processorRef.current = processor;
      micStreamRef.current.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsListening(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to access microphone'
      );
      setIsListening(false);
    }
  }, []);

  // Stop microphone input
  const stopListening = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.disconnect();
      micStreamRef.current = null;
    }
    
    setIsListening(false);
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    stopListening();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    transcript,
    error,
    connect,
    startListening,
    stopListening,
    disconnect,
  };
}
```

### Step 2: Create Component - `VoiceAgentStreamingUI.tsx`

```typescript
// src/components/dashboard/VoiceAgentStreamingUI.tsx
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader } from 'lucide-react';
import { useElevenLabsStreaming } from '../../hooks/useElevenLabsStreaming';

interface VoiceAgentStreamingUIProps {
  customerId: string;
  agentId: string;
  voiceId?: string;
  onClose?: () => void;
}

export function VoiceAgentStreamingUI({
  customerId,
  agentId,
  voiceId,
  onClose,
}: VoiceAgentStreamingUIProps) {
  const { isConnected, isListening, transcript, error, connect, startListening, stopListening, disconnect } =
    useElevenLabsStreaming({
      customerId,
      agentId,
      voiceId,
    });

  const [callActive, setCallActive] = useState(false);

  const handleStartCall = async () => {
    try {
      await connect();
      await startListening();
      setCallActive(true);
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  const handleEndCall = () => {
    stopListening();
    disconnect();
    setCallActive(false);
    onClose?.();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      {/* Status Indicator */}
      <div className="mb-6 flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium">Disconnected</span>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="mb-6 w-full max-w-md">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-1">You said:</p>
            <p className="text-lg text-gray-900">{transcript}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 w-full max-w-md">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {error}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4">
        {!callActive ? (
          <button
            onClick={handleStartCall}
            disabled={isConnected && isListening}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnected ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Start Call
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Listening
                </>
              )}
            </button>

            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          </>
        )}
      </div>

      {/* Audio Visualization (Optional) */}
      {isListening && (
        <div className="mt-6 flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 h-8 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Integrate into Dashboard

```typescript
// src/pages/DashboardPage.tsx (add to existing)
import { VoiceAgentStreamingUI } from '../components/dashboard/VoiceAgentStreamingUI';

export function DashboardPage() {
  const [showVoiceStreaming, setShowVoiceStreaming] = useState(false);
  // ... existing code ...

  return (
    <div>
      {/* Existing dashboard content */}
      {/* ... */}

      {/* Voice Streaming Modal */}
      {showVoiceStreaming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <VoiceAgentStreamingUI
              customerId={userId}
              agentId={agentId}
              onClose={() => setShowVoiceStreaming(false)}
            />
          </div>
        </div>
      )}

      {/* Button to trigger voice streaming */}
      <button
        onClick={() => setShowVoiceStreaming(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Start Voice Call
      </button>
    </div>
  );
}
```

---

## 4. Testing Checklist

### Unit Testing
```typescript
// src/hooks/__tests__/useElevenLabsStreaming.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useElevenLabsStreaming } from '../useElevenLabsStreaming';

describe('useElevenLabsStreaming', () => {
  it('should get stream token from backend', async () => {
    const { result } = renderHook(() =>
      useElevenLabsStreaming({
        customerId: 'test-user',
        agentId: 'test-agent',
      })
    );

    await act(async () => {
      await result.current.connect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should handle microphone input', async () => {
    const { result } = renderHook(() =>
      useElevenLabsStreaming({
        customerId: 'test-user',
        agentId: 'test-agent',
      })
    );

    await act(async () => {
      await result.current.connect();
      await result.current.startListening();
    });

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });
  });

  it('should disconnect properly', async () => {
    const { result } = renderHook(() =>
      useElevenLabsStreaming({
        customerId: 'test-user',
        agentId: 'test-agent',
      })
    );

    await act(async () => {
      await result.current.connect();
      result.current.disconnect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });
});
```

### Integration Testing
```bash
# 1. Start backend
npm run dev

# 2. Start frontend
npm run dev

# 3. Manual testing
- Open browser console
- Navigate to dashboard
- Click "Start Voice Call"
- Verify WebSocket connection in Network tab
- Check WebSocket messages show conversation_initiation
- Speak into microphone
- Verify audio streams back from server
- Check transcript updates in UI
```

### E2E Testing
```typescript
// e2e tests with Cypress or Playwright
test('voice streaming flow', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Start call
  await page.click('button:has-text("Start Voice Call")');
  
  // Wait for connection
  await page.waitForSelector('[data-testid="connected-indicator"]');
  
  // Start listening
  await page.click('button:has-text("Start Listening")');
  
  // Mock audio input
  // ...
  
  // Verify transcript appears
  await expect(page.locator('[data-testid="transcript"]')).toContainText('test');
  
  // End call
  await page.click('button:has-text("End Call")');
  
  // Verify disconnected
  await expect(page.locator('[data-testid="connected-indicator"]')).not.toBeVisible();
});
```

---

## 5. API Reference

### Token Endpoint
```
POST /api/voice-agent/elevenlabs-stream-token

Request:
{
  "customerId": "user-123",
  "agentId": "agent-456",
  "voiceId": "pNInz6obpgDQGcFmaJgB",  // Optional, defaults to config
  "duration": 3600                     // Optional, token expiry in seconds
}

Response:
{
  "token": "base64_encoded_config",
  "expiresIn": 3600
}

Error (400):
{
  "success": false,
  "error": "Missing customerId or agentId"
}
```

### WebSocket Messages

**Incoming from Server:**
```json
// Conversation initialized
{
  "type": "conversation_initiation",
  "conversation_id": "conv-123"
}

// Audio chunk for playback
{
  "type": "audio_out",
  "audio": "base64_encoded_audio"
}

// Transcription of user input
{
  "type": "user_transcript",
  "transcript": "What are your business hours?"
}

// Server message tracking
{
  "type": "server_mid",
  "mid": "msg-456"
}
```

**Outgoing to Server:**
```json
// Send user message (text)
{
  "type": "user_message",
  "message": "Hello, I need help"
}

// Send audio from microphone
{
  "type": "user_audio",
  "audio": "base64_encoded_audio"
}

// Message acknowledgment
{
  "type": "client_mid",
  "mid": "msg-456"
}
```

---

## 6. Troubleshooting

### Issue: WebSocket Connection Fails
**Solution**: 
- Verify token endpoint is accessible
- Check ELEVENLABS_API_KEY in backend env vars
- Ensure `ALLOWED_ORIGINS` includes frontend URL

### Issue: No Audio Output
**Solution**:
- Check browser audio permissions
- Verify `AudioContext` initialization
- Check browser console for decoding errors

### Issue: Microphone Not Detected
**Solution**:
- Check browser microphone permissions
- Verify `getUserMedia` support
- Test with different audio input devices

### Issue: Transcript Empty
**Solution**:
- Verify audio quality
- Check RAG knowledge base has content
- Review LLM response in backend logs

---

## 7. Performance Optimization

### Reduce Latency
```typescript
// Use lower buffer size for faster processing
const processor = audioContext.createScriptProcessor(2048, 1, 1);

// Send audio more frequently (every 100ms instead of buffer flush)
const audioInterval = setInterval(() => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    ws.send(audioBuffer);
  }
}, 100);
```

### Handle Network Issues
```typescript
// Implement exponential backoff reconnection
const reconnectWithBackoff = async (attempt = 0) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  await new Promise(resolve => setTimeout(resolve, delay));
  await connect();
};

ws.onclose = () => {
  reconnectWithBackoff();
};
```

---

## 8. Security Considerations

1. **Server-Side Token Management** ✅
   - Backend generates JWT token with hidden API key
   - Frontend never sees actual ElevenLabs API key
   - Token expires after configurable duration

2. **HTTPS/WSS Only**
   - Always use `wss://` for secure WebSocket
   - Verify SSL certificates in production

3. **Audio Data Handling**
   - Audio transmitted over encrypted WebSocket
   - Don't store raw audio in browser storage
   - Clear buffers after processing

4. **Rate Limiting**
   - Token endpoint rate-limited on backend
   - WebSocket connection limits configured

---

## Next Steps

1. **Implement Hook** - Copy `useElevenLabsStreaming.ts` to `src/hooks/`
2. **Create Component** - Add `VoiceAgentStreamingUI.tsx` to `src/components/dashboard/`
3. **Integrate** - Add button and modal to `DashboardPage.tsx`
4. **Test** - Run unit tests and manual browser testing
5. **Deploy** - Push to production, verify WebSocket works in Docker

---

**Status**: Ready for implementation  
**Estimated Time**: 2-3 hours for full integration + testing  
**Dependencies**: React 19+, TypeScript, WebAudio API support
