export interface VulnerabilityChunkRecord {
  id: string;
  vulnerabilityId: string;
  chunkIndex: number;
  advisoryTextChunk: string;
  embedding: number[];
}

export interface VectorStoreRepository {
  upsert(
    records: VulnerabilityChunkRecord[],
    collectionName: string,
  ): Promise<void>;
  queryByVulnId(
    vulnerabilityId: string,
    collectionName: string,
  ): Promise<VulnerabilityChunkRecord[]>;
}
