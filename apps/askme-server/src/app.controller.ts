import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import VulReachabilityService from './VulReachability.service';
import path from 'path';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly vulReachabilityService: VulReachabilityService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('execute-prompt')
  executePrompt(): Promise<unknown> {
    return this.appService.executePrompt();
  }

  @Get('execute-reachability-analysis')
  executeReachabilityAnalysis(): Promise<unknown> {
    return this.vulReachabilityService.executeReachabilityAnalysis(
      path.resolve(__dirname, '..'),
    );
  }
}
