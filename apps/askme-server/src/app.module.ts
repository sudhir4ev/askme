import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VulnerabilityScannerService } from './VulnerabilityScanner.service';
import VulReachabilityService from './VulReachability.service';
import {
  createOsvScannerOptionsProvider,
  OsvScannerFactoryService,
} from './libs/OsvScanner.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [
    AppService,
    VulReachabilityService,
    createOsvScannerOptionsProvider('OSV_SCANNER_PATH'),
    OsvScannerFactoryService,
    VulnerabilityScannerService,
  ],
})
export class AppModule {}
