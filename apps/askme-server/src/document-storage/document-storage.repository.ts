export interface DocumentStorageRepository {
  getDocument<T>(key: string): Promise<T | null>;
  setDocument<T>(key: string, value: T): Promise<void>;
}
