import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';
import { DocumentStorageRepository } from './document-storage.repository';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';

@Injectable()
export class RedisDocumentStorageRepository
  implements DocumentStorageRepository, OnModuleDestroy
{
  private readonly logger = new Logger(RedisDocumentStorageRepository.name);
  private readonly client: RedisClientType;
  private connectPromise?: Promise<void>;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? DEFAULT_REDIS_URL,
    });
    this.client.on('error', (error: unknown) => {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Redis client error: ${reason}`);
    });
  }

  async getDocument<T>(key: string): Promise<T | null> {
    await this.ensureConnected();
    const value = await this.client.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async setDocument<T>(key: string, value: T): Promise<void> {
    await this.ensureConnected();
    await this.client.set(key, JSON.stringify(value));
  }

  async deleteDocument(key: string): Promise<void> {
    await this.ensureConnected();
    await this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connectPromise = undefined;
        });
    }

    await this.connectPromise;
  }
}
