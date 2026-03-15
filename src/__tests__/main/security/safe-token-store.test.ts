// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafeTokenStore } from '../../../main/security/safe-token-store';

const mockSafeStorage = {
  isEncryptionAvailable: vi.fn(),
  encryptString: vi.fn(),
  decryptString: vi.fn(),
};

const mockFs = {
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
};

describe('SafeTokenStore', () => {
  let store: SafeTokenStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true);
    store = new SafeTokenStore(
      '/mock/data/tokens.enc',
      mockSafeStorage as never,
      mockFs as never,
    );
  });

  it('should return null when no token is stored and file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(store.get()).toBeNull();
  });

  it('should encrypt and persist token on set', () => {
    const encrypted = Buffer.from('encrypted-data');
    mockSafeStorage.encryptString.mockReturnValue(encrypted);

    store.set('my-secret-token');

    expect(mockSafeStorage.encryptString).toHaveBeenCalledWith('my-secret-token');
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/mock/data/tokens.enc',
      encrypted,
    );
  });

  it('should read and decrypt token from disk', () => {
    const encrypted = Buffer.from('encrypted-data');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(encrypted);
    mockSafeStorage.decryptString.mockReturnValue('my-secret-token');

    const token = store.get();

    expect(mockFs.readFileSync).toHaveBeenCalledWith('/mock/data/tokens.enc');
    expect(mockSafeStorage.decryptString).toHaveBeenCalledWith(encrypted);
    expect(token).toBe('my-secret-token');
  });

  it('should fall back to in-memory when encryption is not available', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(false);
    const fallbackStore = new SafeTokenStore(
      '/mock/data/tokens.enc',
      mockSafeStorage as never,
      mockFs as never,
    );

    fallbackStore.set('fallback-token');
    expect(mockSafeStorage.encryptString).not.toHaveBeenCalled();
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();

    expect(fallbackStore.get()).toBe('fallback-token');
  });

  it('should create parent directory if it does not exist on set', () => {
    mockSafeStorage.encryptString.mockReturnValue(Buffer.from('enc'));
    mockFs.writeFileSync.mockImplementation(() => {
      // no-op
    });

    store.set('token');

    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/data', { recursive: true });
  });

  it('should return null when decryption fails', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(Buffer.from('corrupted'));
    mockSafeStorage.decryptString.mockImplementation(() => {
      throw new Error('Decryption failed');
    });

    expect(store.get()).toBeNull();
  });
});
