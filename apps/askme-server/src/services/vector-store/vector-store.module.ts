import { Module } from '@nestjs/common';
import { AdvisoryEmbeddingService } from './advisory-embedding.service';
import { ChromaDbVectorStoreRepository } from './chromadb-vector-store.repository';
import { VECTOR_STORE_REPOSITORY } from './vector-store.tokens';

@Module({
  providers: [
    AdvisoryEmbeddingService,
    ChromaDbVectorStoreRepository,
    {
      provide: VECTOR_STORE_REPOSITORY,
      useExisting: ChromaDbVectorStoreRepository,
    },
  ],
  exports: [AdvisoryEmbeddingService, VECTOR_STORE_REPOSITORY],
})
export class VectoStoreModule {}
