import { Injectable } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EnrichedVulnerabilityAdvisory } from './advisory-enrichment';
import { VulnerabilityChunkRecord } from './vector-store.repository';

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const ADVISORY_CHUNK_SIZE = 1200;
const ADVISORY_CHUNK_OVERLAP = 200;

@Injectable()
export class AdvisoryEmbeddingService {
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: ADVISORY_CHUNK_SIZE,
    chunkOverlap: ADVISORY_CHUNK_OVERLAP,
  });

  private readonly embeddings = new OpenAIEmbeddings({
    model: process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL,
    apiKey: process.env.OPENAI_API_KEY,
  });

  async buildChunkRecords(
    advisory: EnrichedVulnerabilityAdvisory,
  ): Promise<VulnerabilityChunkRecord[]> {
    const chunks = await this.splitter.splitText(advisory.advisoryText);
    if (chunks.length === 0) {
      return [];
    }

    const vectors = await this.embeddings.embedDocuments(chunks);

    return chunks.map((chunk, index) => ({
      id: `${advisory.id}:${index}`,
      vulnerabilityId: advisory.id,
      chunkIndex: index,
      advisoryTextChunk: chunk,
      embedding: vectors[index] ?? [],
    }));
  }
}
