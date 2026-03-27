import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VulnerabilityScanModule } from './vulnerability-scan/vulnerability-scan.module';
import { AstModule } from './services/ast/ast.module';

@Module({
  imports: [ConfigModule.forRoot(), VulnerabilityScanModule, AstModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
