import { Request, Response } from 'express';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { DeepSeekLLM } from './DeepSeekLLM';
import { AzureTTS } from './AzureTTS';
import WebSocket from 'ws';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Simple mu-law to linear PCM decoder
const muLawToLinear = (function () {
  const muLawToPcmMap = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    let mu = 255 - i;
    let sign = (mu & 0x80) >> 7;
    let exponent = (mu & 0x70) >> 4;
    let mantissa = mu & 0x0f;
    let sample = mantissa << 3;
    sample += 132;
    sample <<= exponent;
    sample -= 132;
    if (sign !== 0) sample = -sample;
    muLawToPcmMap[i] = sample;
  }
  return (byte: number) => muLawToPcmMap[byte];
})();

// Linear PCM to mu-law encoder
const linearToMuLaw = (function () {
  const pcmToMuLawMap = new Int8Array(65536);
  const BIAS = 132;
  const CLIP = 32635;

  for (let i = -32768; i <= 32767; i++) {
    let sample = i;
    let sign = (sample >> 8) & 0x80;
    if (sample < 0) sample = -sample;
    if (sample > CLIP) sample = CLIP;
    sample += BIAS;
    let exponent = 7;
    // Determine exponent
    // simple bit search
    const mask = 0x4000;
    for (let exp = 7; exp >= 0; exp--) {
      if ((sample & (mask >> (7 - exp))) !== 0) {
        exponent = exp;
        break;
      }
    }
    let mantissa = (sample >> (exponent + 3)) & 0x0f;
    let mu = ~(sign | (exponent << 4) | mantissa);
    pcmToMuLawMap[i + 32768] = mu;
  }

  return (sample: number) => pcmToMuLawMap[sample + 32768];
})();

export class TwilioVoiceService {
  private azureTTS: AzureTTS;
  private deepSeek: DeepSeekLLM;

  constructor() {
    this.azureTTS = new AzureTTS();
    this.deepSeek = new DeepSeekLLM();
  }

  handleIncomingCall(req: Request, res: Response) {
    const twiml = new VoiceResponse();
    const connect = twiml.connect();
    const stream = connect.stream({
      url: `wss://${req.headers.host}/api/twilio/voice/stream`,
    });
    // Add parameters if needed
    // stream.parameter({ name: '... ', value: '...' });

    res.type('text/xml');
    res.send(twiml.toString());
  }

  handleStreamConnection(ws: WebSocket) {
    const { pushStream, recognizer } = this.azureTTS.createPushStreamRecognizer();

    // Config vars
    let streamSid: string | null = null;
    let callSid: string | null = null;

    const history: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content:
          'You are a helpful voice assistant for a Swiss company. You speak German (Standard German or Swiss German context). Keep answers concise (max 2-3 sentences) suitable for phone conversation.',
      },
    ];

    recognizer.recognizing = (s, e) => {
      // Intermediate results - maybe useful for interruption handling
      // console.log(`RECOGNIZING: Text=${e.result.text}`);
    };

    recognizer.recognized = async (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        const text = e.result.text;
        if (!text) return;

        console.log(`RECOGNIZED: Text=${text}`);

        // Add user input to history
        history.push({ role: 'user', content: text });

        // Send to DeepSeek
        try {
          const responseText = await this.deepSeek.chat(history);

          console.log(`AI RESPONSE: ${responseText}`);
          history.push({ role: 'assistant', content: responseText });

          // Synthesize response
          const wavBuffer = await this.azureTTS.synthesize(responseText);

          // Strip RIFF header (44 bytes standard)
          const pcmData = wavBuffer.subarray(44);

          // Convert PCM16 to Mulaw
          const mulawBuffer = Buffer.alloc(pcmData.length / 2);
          for (let i = 0; i < pcmData.length; i += 2) {
            const sample = pcmData.readInt16LE(i);
            mulawBuffer[i / 2] = linearToMuLaw(sample);
          }

          // Send to Twilio in chunks (optimally) or whole
          // Twilio recommends small chunks, but larger ones work too.
          // Let's send 1600 bytes (100ms) chunks to avoid flooding
          const chunkSize = 3200; // 200ms
          for (let i = 0; i < mulawBuffer.length; i += chunkSize) {
            const chunk = mulawBuffer.subarray(i, i + chunkSize);
            const payload = chunk.toString('base64');

            if (streamSid && ws.readyState === WebSocket.OPEN) {
              const msg = {
                event: 'media',
                streamSid: streamSid,
                media: {
                  payload: payload,
                },
              };
              ws.send(JSON.stringify(msg));
            }
          }

          // Mark response complete (optional, just to keep track)
          if (streamSid && ws.readyState === WebSocket.OPEN) {
            const markMsg = {
              event: 'mark',
              streamSid: streamSid,
              mark: { name: 'response_end' },
            };
            ws.send(JSON.stringify(markMsg));
          }
        } catch (error) {
          console.error('AI/TTS Error:', error);
        }
      }
    };

    recognizer.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);
      if (e.reason === sdk.CancellationReason.Error) {
        console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
      }
      recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStarted = (s, e) => {
      console.log('Session started event.');
    };

    recognizer.sessionStopped = (s, e) => {
      console.log('Session stopped event.');
      recognizer.stopContinuousRecognitionAsync();
    };

    // Start recognition
    recognizer.startContinuousRecognitionAsync();

    ws.on('message', (message: string) => {
      const msg = JSON.parse(message);
      switch (msg.event) {
        case 'connected':
          console.log('Twilio Stream Connected');
          break;
        case 'start':
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          console.log(`Stream started: ${streamSid}`);
          break;
        case 'media':
          if (msg.media.track === 'inbound') {
            // Decode MuLaw to PCM16
            const chunk = Buffer.from(msg.media.payload, 'base64');
            const pcmBuffer = new Int16Array(chunk.length);
            for (let i = 0; i < chunk.length; i++) {
              pcmBuffer[i] = muLawToLinear(chunk[i]);
            }
            // Send to Azure
            pushStream.write(pcmBuffer.buffer);
          }
          break;
        case 'stop':
          console.log('Stream stopped');
          ws.close();
          pushStream.close();
          recognizer.stopContinuousRecognitionAsync();
          break;
      }
    });
    ws.on('close', () => {
      pushStream.close();
      recognizer.stopContinuousRecognitionAsync();
    });
  }

  cleanup() {
    console.log('Cleaning up TwilioVoiceService...');
    // Add specific cleanup logic if needed
  }
}

export const twilioVoiceService = new TwilioVoiceService();
