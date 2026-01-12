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

    recognizer.recognizing = (s, e) => {
      // Intermediate results - maybe useful for interruption handling
      // console.log(`RECOGNIZING: Text=${e.result.text}`);
    };

    recognizer.recognized = async (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        const text = e.result.text;
        if (!text) return;

        console.log(`RECOGNIZED: Text=${text}`);

        // Send to DeepSeek
        try {
          // TODO: Maintain conversation history
          const responseText = await this.deepSeek.chat([{ role: 'user', content: text }]);

          console.log(`AI RESPONSE: ${responseText}`);

          // Synthesize response
          // TODO: We need mulaw output or Twilio compatible format.
          // Azure TTS returns WAV (Riff). We need to extract PCM and encode to mulaw or send as is?
          // Twilio Media Stream accepts 8k mulaw.
          // Azure TTS can be configured to output Riff8Khz8BitMonoMULaw!

          // We need to update AzureTTS to allow setting output format for this specific call,
          // or we re-instantiate/configure it here.

          // For now, let's assume we can get MuLaw from Azure if we configure it.
          // Since AzureTTS.ts hardcodes 'de-CH-LeniNeural', let's stick to that but we need format control.

          // TEMPORARY: Just logging response for this step.
          // To implement full bi-directional, we need to handle format conversion or config.
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
}

export const twilioVoiceService = new TwilioVoiceService();
