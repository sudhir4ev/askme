export interface VulnerabilityChunkRecord {
  id: string;
  vulnerabilityId: string;
  chunkIndex: number;
  advisoryTextChunk: string;
  embedding: number[];
}

export interface VectorStoreRepository {
  upsert(records: VulnerabilityChunkRecord[]): Promise<void>;
  queryByVulnId(vulnerabilityId: string): Promise<VulnerabilityChunkRecord[]>;
}
