import { Inject, Injectable, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OsvScanner from './OsvScanner.lib';

export interface OsvScannerModuleOptions {
  executablePath: string;
}

export interface OsvPackageResult {
  package: {
    name: string;
  };
}

export interface OsvScanResultItem {
  packages: OsvPackageResult[];
}

export interface OsvScanResult {
  result: {
    results: OsvScanResultItem[];
  };
  error?: string;
  resultCode: number;
}

export interface OsvScannerClient {
  parseManifest(): Promise<OsvScanResult>;
}

export const OSV_SCANNER_OPTIONS = Symbol('OSV_SCANNER_OPTIONS');

@Injectable()
export class OsvScannerFactoryService {
  constructor(
    @Inject(OSV_SCANNER_OPTIONS)
    private readonly options: OsvScannerModuleOptions,
  ) {}

  createScanner(projectPath: string): OsvScannerClient {
    return new OsvScanner(
      projectPath,
      this.options.executablePath,
    ) as OsvScannerClient;
  }
}

export function createOsvScannerOptionsProvider(
  osvScannerPath: string,
): Provider {
  return {
    provide: OSV_SCANNER_OPTIONS,
    inject: [ConfigService],
    useFactory: (configService: ConfigService): OsvScannerModuleOptions => ({
      executablePath: configService.get<string>(osvScannerPath) ?? '',
    }),
  };
}
