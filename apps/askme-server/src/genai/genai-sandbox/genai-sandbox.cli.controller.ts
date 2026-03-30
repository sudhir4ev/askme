import { Controller, Inject } from '@nestjs/common';
import { Command } from 'commander';
import { COMMANDER_PROGRAM } from 'src/contants';
import { GenaiSandboxService } from './genai-sandbox.service';

@Controller('genai-sandbox')
export class GenaiSandboxCliController {
  private mainCommand: Command;
  constructor(
    @Inject(COMMANDER_PROGRAM) private readonly program: Command,
    private readonly genaiSandboxService: GenaiSandboxService,
  ) {
    this.mainCommand = this.program
      .command('gsb')
      .description('Test LLMs behavior');

    this.mainCommand
      .command('execute-prompt')
      .description('Test LLMs behavior')
      .action(() => this.executePrompt());
  }

  private async executePrompt() {
    const result = await this.genaiSandboxService.executePrompt(
      'Hello, how are you?',
    );
    console.log(result);
  }
}
