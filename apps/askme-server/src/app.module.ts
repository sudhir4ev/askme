import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VulnerabilityScannerService } from './VulnerabilityScanner.service';
import VulReachabilityService from './VulReachability.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, VulReachabilityService, VulnerabilityScannerService],
})
export class AppModule {}
