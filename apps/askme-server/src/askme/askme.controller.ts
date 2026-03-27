import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AskMeService } from './askme.service';
import type {
  SourceFetchResponse,
  SourceScanRequest,
  SourceStatusResponse,
} from './askme.types';
import type { VulnerabilityScanTriggerResponse } from '../vulnerability-scan/vulnerability-scan.service';

@Controller('askme/source')
export class AskMeController {
  constructor(private readonly askMeService: AskMeService) {}

  @Post('fetch')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
    }),
  )
  fetchSource(
    @UploadedFile()
    file?: {
      originalname: string;
      buffer: Buffer;
    },
    @Body() body?: { githubUrl?: string },
  ): Promise<SourceFetchResponse> {
    return this.askMeService.fetchSource({
      file,
      githubUrl: body?.githubUrl,
    });
  }

  @Post('scan')
  scanSource(
    @Body() body: SourceScanRequest,
  ): Promise<VulnerabilityScanTriggerResponse> {
    return this.askMeService.scanSource(body);
  }

  @Get(':sourceId/status')
  getSourceStatus(
    @Param('sourceId') sourceId: string,
  ): Promise<SourceStatusResponse> {
    return this.askMeService.getSourceStatus(sourceId);
  }
}
