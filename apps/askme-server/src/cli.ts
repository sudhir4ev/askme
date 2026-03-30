import { NestFactory } from '@nestjs/core';
import { CliAppModule } from './cli-app/cli-app.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(CliAppModule, { logger: false });
}

bootstrap();
