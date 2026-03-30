import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VulnerabilityScanModule } from './vulnerability-scan/vulnerability-scan.module';
import { AstModule } from './services/ast/ast.module';
import { AskMeModule } from './askme/askme.module';
import { CliAppModule } from './cli-app/cli-app.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    VulnerabilityScanModule,
    AstModule,
    AskMeModule,
    CliAppModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
