import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export class AzureTTS {
  private config: sdk.SpeechConfig;

  constructor() {
    this.config = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION || 'westeurope',
    );
    this.config.speechSynthesisVoiceName = 'de-CH-LeniNeural';
  }

  async synthesize(text: string): Promise<Buffer> {
    const synthesizer = new sdk.SpeechSynthesizer(this.config, null as any); // using null for audio config to just get bytes
    return new Promise((resolve, reject) => {
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
