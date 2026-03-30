import { Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { Command } from 'commander';
import { COMMANDER_PROGRAM } from 'src/contants';
import { CliServiceService } from './cli-service.service';
import { GenaiSandboxCliController } from '../genai/genai-sandbox/genai-sandbox.cli.controller';
import { GenaiSandboxService } from 'src/genai/genai-sandbox/genai-sandbox.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    {
      provide: COMMANDER_PROGRAM,
      useValue: new Command('askme-cli').usage('<command> [<args>]'),
    },
    CliServiceService,
    GenaiSandboxService,
  ],
  controllers: [GenaiSandboxCliController],
})
export class CliAppModule implements OnApplicationBootstrap {
  constructor(@Inject(COMMANDER_PROGRAM) private readonly program: Command) {}

  onApplicationBootstrap() {
    this.program
      .command('test')
      .description('Test LLMs behavior')
      .action(() => {
        console.log('test');
      });
    this.program.parse(process.argv);
  }
}
