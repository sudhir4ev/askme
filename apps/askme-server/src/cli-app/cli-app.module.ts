import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { CliServiceService } from './cli-service.service';
import { Command } from 'commander';
import { COMMANDER_PROGRAM } from 'src/contants';

@Module({
  providers: [
    {
      provide: COMMANDER_PROGRAM,
      useValue: new Command('askme-cli').usage('<command> [<args>]'),
    },
    CliServiceService,
  ],
})
export class CliAppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(CliAppModule.name);

  onApplicationBootstrap() {
    this.logger.log('onApplicationBootstrap', process.argv.join(' '));
    const program = new Command();

    program.command('scan').action(() => {
      this.logger.log('scanning');
      console.log('scanning...', process.argv.join(' '));
    });
    program.parse(process.argv);
  }
}
