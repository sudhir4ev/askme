import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { extname } from 'node:path';
import { DOCUMENT_STORAGE_REPOSITORY } from '../document-storage/document-storage.tokens';
import type { DocumentStorageRepository } from '../document-storage/document-storage.repository';
import {
  VulnerabilityScanService,
  type VulnerabilityScanTriggerResponse,
} from '../vulnerability-scan/vulnerability-scan.service';
import type {
  SourceFetchResponse,
  SourceRecord,
  SourceStatusResponse,
  SourceScanRequest,
  SourceType,
} from './askme.types';

type UploadedFile = {
  originalname: string;
  buffer: Buffer;
};

const SOURCE_KEY_PREFIX = 'source';
const SOURCE_SCAN_KEY_PREFIX = 'source-scan';
const execFileAsync = promisify(execFile);
const SOURCE_TEMP_PREFIX = 'askme-source-';
type DisposableTempDir = {
  path: string;
  remove: () => Promise<void>;
};

@Injectable()
export class AskMeService {
  private readonly logger = new Logger(AskMeService.name);
  private readonly sourceTempDirs = new Map<string, DisposableTempDir>();

  constructor(
    @Inject(DOCUMENT_STORAGE_REPOSITORY)
    private readonly documentStorageRepository: DocumentStorageRepository,
    private readonly vulnerabilityScanService: VulnerabilityScanService,
  ) {}

  async fetchSource(input: {
    file?: UploadedFile;
    githubUrl?: string;
  }): Promise<SourceFetchResponse> {
    const hasFile = Boolean(input.file);
    const hasGithubUrl = Boolean(input.githubUrl?.trim());
    if (!hasFile && !hasGithubUrl) {
      throw new BadRequestException(
        'Provide a zip file upload or a public GitHub URL.',
      );
    }
    if (hasFile && hasGithubUrl) {
      throw new BadRequestException(
        'Use either file upload or githubUrl, not both in one request.',
      );
    }

    const sourceId = randomUUID();
    const disposableTempDir = await this.createDisposableTempDir(
      path.join(tmpdir(), SOURCE_TEMP_PREFIX),
    );
    const sourceBaseDir = disposableTempDir.path;
    this.sourceTempDirs.set(sourceId, disposableTempDir);

    const sourceType: SourceType = hasFile ? 'zip' : 'github';
    let extractedPath: string;
    try {
      extractedPath = hasFile
        ? await this.extractUploadedArchive(sourceBaseDir, input.file!)
        : await this.downloadGithubRepository(
            sourceBaseDir,
            input.githubUrl!.trim(),
          );
    } catch (error: unknown) {
      await this.cleanupTempDir(sourceId, sourceBaseDir);
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Unable to fetch source: ${reason}`);
      throw new BadRequestException(`Source fetch failed: ${reason}`);
    }

    const sourceRecord: SourceRecord = {
      sourceId,
      tempDir: sourceBaseDir,
      sourcePath: extractedPath,
      sourceType,
      status: 'ready',
      createdAt: new Date().toISOString(),
    };
    try {
      await this.documentStorageRepository.setDocument(
        this.buildSourceKey(sourceId),
        sourceRecord,
      );
    } catch (error: unknown) {
      await this.cleanupTempDir(sourceId, sourceBaseDir);
      throw error;
    }

    return {
      sourceId,
      sourcePath: sourceRecord.sourcePath,
      status: sourceRecord.status,
    };
  }

  async scanSource(
    request: SourceScanRequest,
  ): Promise<VulnerabilityScanTriggerResponse> {
    if (!request.requestId?.trim()) {
      throw new BadRequestException('requestId is required.');
    }
    if (!request.sourceId?.trim()) {
      throw new BadRequestException('sourceId is required.');
    }

    const rawSourceRecord =
      await this.documentStorageRepository.getDocument<unknown>(
        this.buildSourceKey(request.sourceId),
      );
    const sourceRecord = this.parseSourceRecord(
      rawSourceRecord,
      request.sourceId,
    );
    if (!sourceRecord) {
      throw new NotFoundException(`Unknown sourceId: ${request.sourceId}`);
    }

    sourceRecord.status = 'scanning';
    await this.documentStorageRepository.setDocument(
      this.buildSourceKey(request.sourceId),
      sourceRecord,
    );

    try {
      const response = await this.vulnerabilityScanService.scan(
        request.requestId,
        sourceRecord.sourcePath,
        request.skipCache,
      );
      await this.documentStorageRepository.setDocument(
        this.buildSourceScanKey(request.sourceId),
        {
          sourceId: request.sourceId,
          requestId: request.requestId,
          scannedAt: new Date().toISOString(),
          response,
        },
      );
      sourceRecord.status = 'scanned';
      await this.documentStorageRepository.setDocument(
        this.buildSourceKey(request.sourceId),
        sourceRecord,
      );
      const sourceTempDir = path.dirname(sourceRecord.sourcePath);
      await this.cleanupTempDir(request.sourceId, sourceTempDir);
      await this.deleteSourceRecord(request.sourceId);
      return response;
    } catch (error: unknown) {
      sourceRecord.status = 'ready';
      await this.documentStorageRepository.setDocument(
        this.buildSourceKey(request.sourceId),
        sourceRecord,
      );
      throw error;
    }
  }

  async getSourceStatus(sourceId: string): Promise<SourceStatusResponse> {
    const normalizedSourceId = sourceId.trim();
    if (!normalizedSourceId) {
      throw new BadRequestException('sourceId is required.');
    }

    const [sourceRecord, scanRecord] = await Promise.all([
      this.documentStorageRepository.getDocument<unknown>(
        this.buildSourceKey(normalizedSourceId),
      ),
      this.getStoredScanResult(normalizedSourceId),
    ]);
    const parsedSourceRecord = this.parseSourceRecord(
      sourceRecord,
      normalizedSourceId,
    );

    return {
      sourceId: normalizedSourceId,
      sourceExists: Boolean(parsedSourceRecord),
      sourceStatus: parsedSourceRecord?.status ?? null,
      hasScanRecord: Boolean(scanRecord),
      scanResponse: scanRecord?.response ?? null,
    };
  }

  private async extractUploadedArchive(
    sourceBaseDir: string,
    file: UploadedFile,
  ): Promise<string> {
    const lowerName = file.originalname.toLowerCase();
    const archivePath = path.join(
      sourceBaseDir,
      `upload${extname(lowerName) || '.zip'}`,
    );
    const extractionTarget = path.join(sourceBaseDir, 'workspace');
    await fs.writeFile(archivePath, file.buffer);
    await fs.mkdir(extractionTarget, { recursive: true });

    try {
      if (lowerName.endsWith('.zip')) {
        await execFileAsync('unzip', [
          '-q',
          archivePath,
          '-d',
          extractionTarget,
        ]);
      } else if (
        lowerName.endsWith('.tar') ||
        lowerName.endsWith('.tar.gz') ||
        lowerName.endsWith('.tgz')
      ) {
        await execFileAsync('tar', [
          '-xf',
          archivePath,
          '-C',
          extractionTarget,
        ]);
      } else {
        throw new Error(
          'Unsupported archive format. Upload .zip, .tar, or .tgz.',
        );
      }
    } finally {
      await fs.rm(archivePath, { force: true });
    }

    return this.resolveWorkspacePath(extractionTarget);
  }

  private async downloadGithubRepository(
    sourceBaseDir: string,
    githubUrl: string,
  ): Promise<string> {
    const { owner, repo } = this.parseGithubRepository(githubUrl);
    const cloneUrl = `https://github.com/${owner}/${repo}.git`;
    const checkoutTarget = path.join(sourceBaseDir, 'workspace');

    await execFileAsync('git', [
      'clone',
      '--depth=1',
      cloneUrl,
      checkoutTarget,
    ]);

    const gitMetadataDir = path.join(checkoutTarget, '.git');
    await fs.rm(gitMetadataDir, { recursive: true, force: true });
    return checkoutTarget;
  }

  private parseGithubRepository(githubUrl: string): {
    owner: string;
    repo: string;
  } {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(githubUrl);
    } catch {
      throw new Error('Invalid githubUrl.');
    }

    const host = parsedUrl.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') {
      throw new Error('Only github.com public repositories are supported.');
    }

    const segments = parsedUrl.pathname
      .split('/')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (segments.length < 2) {
      throw new Error(
        'githubUrl must include owner and repository (https://github.com/<owner>/<repo>).',
      );
    }

    const owner = segments[0];
    const repo = segments[1].endsWith('.git')
      ? segments[1].slice(0, -4)
      : segments[1];
    if (!owner || !repo) {
      throw new Error('Invalid githubUrl repository path.');
    }

    return { owner, repo };
  }

  private async resolveWorkspacePath(
    extractionTarget: string,
  ): Promise<string> {
    const entries = await fs.readdir(extractionTarget, { withFileTypes: true });
    const nonHiddenEntries = entries.filter(
      (entry) => !entry.name.startsWith('.'),
    );
    if (
      nonHiddenEntries.length === 1 &&
      nonHiddenEntries[0] &&
      nonHiddenEntries[0].isDirectory()
    ) {
      return path.join(extractionTarget, nonHiddenEntries[0].name);
    }

    return extractionTarget;
  }

  private async cleanupTempDir(
    sourceId: string,
    sourceRoot: string,
  ): Promise<void> {
    const disposableTempDir = this.sourceTempDirs.get(sourceId);
    this.sourceTempDirs.delete(sourceId);
    if (disposableTempDir) {
      await disposableTempDir.remove();
      return;
    }

    await fs.rm(sourceRoot, { recursive: true, force: true });
  }

  private async createDisposableTempDir(
    prefix: string,
  ): Promise<DisposableTempDir> {
    const tempPath = await fs.mkdtemp(prefix);
    return {
      path: tempPath,
      remove: () => fs.rm(tempPath, { recursive: true, force: true }),
    };
  }

  private parseSourceRecord(
    value: unknown,
    fallbackSourceId: string,
  ): SourceRecord | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const sourcePath =
      typeof record.sourcePath === 'string' ? record.sourcePath : null;
    if (!sourcePath || sourcePath.length === 0) {
      return null;
    }

    const tempDir =
      typeof record.tempDir === 'string' && record.tempDir.length > 0
        ? record.tempDir
        : path.dirname(sourcePath);
    const sourceType: SourceType =
      record.sourceType === 'github' ? 'github' : 'zip';
    const statusRecord = record.status;
    const status: SourceRecord['status'] =
      statusRecord === 'scanning' || statusRecord === 'scanned'
        ? statusRecord
        : 'ready';
    const createdAt =
      typeof record.createdAt === 'string' && record.createdAt.length > 0
        ? record.createdAt
        : new Date().toISOString();
    const sourceId =
      typeof record.sourceId === 'string' && record.sourceId.length > 0
        ? record.sourceId
        : fallbackSourceId;

    return {
      sourceId,
      tempDir,
      sourcePath,
      sourceType,
      status,
      createdAt,
    };
  }

  private async deleteSourceRecord(sourceId: string): Promise<void> {
    if ('deleteDocument' in this.documentStorageRepository) {
      await this.documentStorageRepository.deleteDocument?.(
        this.buildSourceKey(sourceId),
      );
      return;
    }

    await this.documentStorageRepository.setDocument(
      this.buildSourceKey(sourceId),
      null,
    );
  }

  private buildSourceKey(sourceId: string): string {
    return `${SOURCE_KEY_PREFIX}:${sourceId}`;
  }

  private buildSourceScanKey(sourceId: string): string {
    return `${SOURCE_SCAN_KEY_PREFIX}:${sourceId}`;
  }

  private getStoredScanResult(sourceId: string): Promise<{
    sourceId: string;
    requestId: string;
    scannedAt: string;
    response: VulnerabilityScanTriggerResponse;
  } | null> {
    return this.documentStorageRepository.getDocument<{
      sourceId: string;
      requestId: string;
      scannedAt: string;
      response: VulnerabilityScanTriggerResponse;
    }>(this.buildSourceScanKey(sourceId));
  }
}
