import { Body, Controller, Post } from '@nestjs/common';
import { AstService } from './ast.service';
import type { AstExtractRequest, AstExtractResponse } from './types';

@Controller('ast')
export class AstController {
  constructor(private readonly astService: AstService) {}

  @Post('extract')
  extract(@Body() payload: AstExtractRequest): Promise<AstExtractResponse> {
    return this.astService.extract(payload);
  }
}
