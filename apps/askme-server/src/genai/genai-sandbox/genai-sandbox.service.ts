import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GenaiSandboxService {
  async executePrompt(prompt: string) {
    const model = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await model.invoke(prompt);
    return result;
  }
}
