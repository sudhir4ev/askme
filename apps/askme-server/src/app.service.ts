// @eslint-disable

import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
// import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async executePrompt() {
    const parser = StructuredOutputParser.fromZodSchema(reachabilitySchema);

    const prompt = PromptTemplate.fromTemplate(`
      You are a security expert analyzing whether a vulnerable function is reachable.

      Vulnerability Details:
      - Library: {library}
      - Vulnerable Function: {functionName}
      - CVE Description: {cveDescription}

      Code Snippets from the Project:
      {codeSnippets}

      Instructions:
      {formatInstructions}
      `);

    const model = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });

    const chain = prompt.pipe(model).pipe(parser);

    const result = await chain.invoke({
      library: 'lodash',
      functionName: 'merge',
      cveDescription: 'Prototype pollution vulnerability in lodash.merge',
      codeSnippets: snippets
        .map((s) => `File: ${s.file}\n${s.code}`)
        .join('\n\n'),
      formatInstructions: parser.getFormatInstructions(),
    });
    
    return result;
  }
}

const snippets = [
  {
    file: 'lodash.js',
    code: 'function merge(a, b) { return a + b; }',
  },
];

// Define structured output schema
const reachabilitySchema = z.object({
  reachable: z
    .boolean()
    .describe('Whether the vulnerable function is reachable'),
  explanation: z.string().describe('Explanation of the reasoning'),
  codePaths: z
    .array(z.string())
    .describe('Code paths where the function is called'),
  confidence: z.number().min(0).max(1).describe('Confidence score'),
});

// console.log(result);
// { reachable: true, explanation: "...", codePaths: [...], confidence: 0.95 }
