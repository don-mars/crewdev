import type { TokenStore } from '../integrations/linear';
import { logger } from '../../shared/utils/logger';

interface SafeStorageApi {
  isEncryptionAvailable(): boolean;
  encryptString(plainText: string): Buffer;
  decryptString(encrypted: Buffer): string;
}

interface FsApi {
  existsSync(path: string): boolean;
  readFileSync(path: string): Buffer;
  writeFileSync(path: string, data: Buffer): void;
  mkdirSync(path: string, options: { recursive: boolean }): void;
}

export class SafeTokenStore implements TokenStore {
  private readonly filePath: string;
  private readonly safeStorage: SafeStorageApi;
  private readonly fs: FsApi;
  private readonly encrypted: boolean;
  private memoryFallback: string | null = null;

  constructor(filePath: string, safeStorage: SafeStorageApi, fs: FsApi) {
    this.filePath = filePath;
    this.safeStorage = safeStorage;
    this.fs = fs;
    this.encrypted = safeStorage.isEncryptionAvailable();
  }

  get(): string | null {
    if (!this.encrypted) {
      return this.memoryFallback;
    }

    if (!this.fs.existsSync(this.filePath)) {
      return null;
    }

    try {
      const buffer = this.fs.readFileSync(this.filePath);
      return this.safeStorage.decryptString(buffer);
    } catch (err: unknown) {
      logger.warn('Failed to decrypt token from disk', { error: err });
      return null;
    }
  }

  set(token: string): void {
    if (!this.encrypted) {
      this.memoryFallback = token;
      return;
    }

    const dir = this.filePath.substring(0, this.filePath.lastIndexOf('/'));
    this.fs.mkdirSync(dir, { recursive: true });
    const encrypted = this.safeStorage.encryptString(token);
    this.fs.writeFileSync(this.filePath, encrypted);
  }
}
