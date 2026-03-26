import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VulnerabilityScanModule } from './vulnerability-scan/vulnerability-scan.module';

@Module({
  imports: [ConfigModule.forRoot(), VulnerabilityScanModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
