import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VulnerabilityScanModule } from './vulnerability-scan/vulnerability-scan.module';
import { AstModule } from './services/ast/ast.module';
import { AskMeModule } from './askme/askme.module';

@Module({
  imports: [ConfigModule.forRoot(), VulnerabilityScanModule, AstModule, AskMeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
