import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    // private readonly vulReachabilityService: VulReachabilityService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('execute-prompt')
  executePrompt(): Promise<unknown> {
    return this.appService.executePrompt();
  }
}
