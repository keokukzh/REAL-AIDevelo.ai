import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export class AzureTTS {
  private config: sdk.SpeechConfig;

  constructor() {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'westeurope';

    if (!key || key === '' || key.includes('placeholder')) {
      // Don't crash here, but synthesize will fail
      this.config = null as unknown as sdk.SpeechConfig;
      console.warn('AzureTTS: Missing or placeholder AZURE_SPEECH_KEY. Synthesis will fail.');
      return;
    }

    this.config = sdk.SpeechConfig.fromSubscription(key, region);
    if (this.config) {
      this.config.speechSynthesisVoiceName = 'de-CH-LeniNeural';
      // Set output format to 8kHz 16-bit mono PCM (RIFF) to match Twilio's sample rate requirement
      this.config.speechSynthesisOutputFormat =
        sdk.SpeechSynthesisOutputFormat.Riff8Khz16BitMonoPcm;
    }
  }

  async synthesize(text: string, voiceName?: string): Promise<Buffer> {
    if (!this.config) {
      throw new Error('Azure TTS is not configured. Please set a valid AZURE_SPEECH_KEY.');
    }

    // Create a local synthesizer to avoid side-effects on shared config
    const synthesizer = new sdk.SpeechSynthesizer(this.config, null as unknown as sdk.AudioConfig);

    return new Promise((resolve, reject) => {
      // Use SSML if voiceName is provided to ensure it's used
      if (voiceName) {
        const ssml = `
          <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de-CH">
            <voice name="${voiceName}">
              ${text}
            </voice>
          </speak>`;
        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            synthesizer.close();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              resolve(Buffer.from(result.audioData));
            } else {
              reject(new Error(`Azure TTS Error: ${result.errorDetails}`));
            }
          },
          (err) => {
            synthesizer.close();
            reject(err);
          },
        );
      } else {
        synthesizer.speakTextAsync(
          text,
          (result) => {
            synthesizer.close();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              resolve(Buffer.from(result.audioData));
            } else {
              reject(new Error(`Azure TTS Error: ${result.errorDetails}`));
            }
          },
          (err) => {
            synthesizer.close();
            reject(err);
          },
        );
      }
    });
  }

  /**
   * Create a push stream for continuous recognition
   */
  createPushStreamRecognizer(): {
    pushStream: sdk.PushAudioInputStream;
    recognizer: sdk.SpeechRecognizer;
  } {
    const pushStream = sdk.AudioInputStream.createPushStream(
      sdk.AudioStreamFormat.getWaveFormatPCM(8000, 16, 1), // Twilio is 8kHz mulaw, but we might need to decode first?
      // Twilio sends mulaw. Azure expects PCM unless specified.
      // Actually, Azure SDK for JS supports G.711 MuLaw?
      // SDK only supports PCM 16-bit. We MUST decode mu-law to PCM-16.
    );

    // Wait, Twilio sends G.711 mu-law 8000Hz.
    // We need to convert mu-law to PCM.
    // OR we ask Azure if it supports other formats.
    // The JS SDK is limited.

    // Let's assume we handle decoding in the service.
    // Just simple PCM 16 config here.
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(this.config, audioConfig);

    return { pushStream, recognizer };
  }
}
