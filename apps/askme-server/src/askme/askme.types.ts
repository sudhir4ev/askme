import type { VulnerabilityScanTriggerResponse } from '../vulnerability-scan/vulnerability-scan.service';

export type SourceType = 'zip' | 'github';

export interface SourceRecord {
  sourceId: string;
  tempDir: string;
  sourcePath: string;
  sourceType: SourceType;
  status: 'ready' | 'scanning' | 'scanned';
  createdAt: string;
}

export interface SourceFetchResponse {
  sourceId: string;
  sourcePath: string;
  status: SourceRecord['status'];
}

export interface SourceScanRequest {
  requestId: string;
  sourceId: string;
  skipCache?: boolean;
}

export interface SourceStatusResponse {
  sourceId: string;
  sourceExists: boolean;
  sourceStatus: SourceRecord['status'] | null;
  hasScanRecord: boolean;
  scanResponse: VulnerabilityScanTriggerResponse | null;
}
