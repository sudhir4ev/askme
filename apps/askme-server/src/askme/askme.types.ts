export type SourceType = 'zip' | 'github';

export interface SourceRecord {
  sourceId: string;
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
