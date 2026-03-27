import { Module } from '@nestjs/common';
import { DocumentStorageModule } from '../document-storage/document-storage.module';
import { VulnerabilityScanModule } from '../vulnerability-scan/vulnerability-scan.module';
import { AskMeController } from './askme.controller';
import { AskMeService } from './askme.service';

@Module({
  imports: [DocumentStorageModule, VulnerabilityScanModule],
  controllers: [AskMeController],
  providers: [AskMeService],
})
export class AskMeModule {}
