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
}
