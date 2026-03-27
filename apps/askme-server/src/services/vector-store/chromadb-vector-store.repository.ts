import { Injectable, Logger } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import {
  VectorStoreRepository,
  VulnerabilityChunkRecord,
} from './vector-store.repository';

const DEFAULT_CHROMA_COLLECTION = 'askme_vulnerability_advisories';

@Injectable()
export class ChromaDbVectorStoreRepository implements VectorStoreRepository {
  private readonly logger = new Logger(ChromaDbVectorStoreRepository.name);
  private collectionPromise?: Promise<Collection>;
  private readonly client = new ChromaClient({
    path: process.env.CHROMA_URL,
  });

  async upsert(
    records: VulnerabilityChunkRecord[],
    collectionName: string,
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const collection = await this.getCollection(collectionName);
    await collection.upsert({
      ids: records.map((record) => record.id),
      embeddings: records.map((record) => record.embedding),
      documents: records.map((record) => record.advisoryTextChunk),
      metadatas: records.map((record) => ({
        vulnerabilityId: record.vulnerabilityId,
        chunkIndex: record.chunkIndex,
      })),
    });
  }

  async queryByVulnId(
    vulnerabilityId: string,
    collectionName: string,
  ): Promise<VulnerabilityChunkRecord[]> {
    const collection = await this.getCollection(collectionName);
    const results = await collection.get({
      where: {
        vulnerabilityId: {
          $eq: vulnerabilityId,
        },
      },
      include: ['embeddings', 'documents', 'metadatas'],
    });

    const ids = results.ids ?? [];
    const documents = results.documents ?? [];
    const metadatas = results.metadatas ?? [];
    const embeddings = results.embeddings ?? [];

    return ids.map((id, index) => {
      const metadata = metadatas[index];
      const chunkIndex =
        metadata && typeof metadata === 'object' && 'chunkIndex' in metadata
          ? Number(metadata.chunkIndex)
          : index;

      return {
        id: String(id),
        vulnerabilityId,
        chunkIndex,
        advisoryTextChunk: String(documents[index] ?? ''),
        embedding: Array.isArray(embeddings[index]) ? embeddings[index] : [],
      };
    });
  }

  private async getCollection(name: string): Promise<Collection> {
    if (!this.collectionPromise) {
      this.collectionPromise = this.client
        .getOrCreateCollection({
          name: name ?? DEFAULT_CHROMA_COLLECTION,
        })
        .catch((error: unknown) => {
          this.collectionPromise = undefined;
          this.logger.error('Failed to initialize Chroma collection', error);
          throw error;
        });
    }

    return this.collectionPromise;
  }
}
