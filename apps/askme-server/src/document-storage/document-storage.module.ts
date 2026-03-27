import { Module } from '@nestjs/common';
import { DOCUMENT_STORAGE_REPOSITORY } from './document-storage.tokens';
import { RedisDocumentStorageRepository } from './redis-document-storage.repository';

@Module({
  providers: [
    RedisDocumentStorageRepository,
    {
      provide: DOCUMENT_STORAGE_REPOSITORY,
      useExisting: RedisDocumentStorageRepository,
    },
  ],
  exports: [DOCUMENT_STORAGE_REPOSITORY],
})
export class DocumentStorageModule {}
