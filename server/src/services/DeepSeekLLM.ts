import OpenAI from 'openai';

export class DeepSeekLLM {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      this.client = null as any;
      console.warn('[DeepSeekLLM] Missing or placeholder DeepSeek API key.');
      return;
    }
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages as any,
      max_tokens: 500,
    });
    return response.choices[0].message.content || '';
  }
}
