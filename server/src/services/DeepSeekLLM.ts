import OpenAI from 'openai';

export class DeepSeekLLM {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
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
