import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger utility', () => {
  let originalNodeEnv: string | undefined;
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  async function getLogger() {
    const mod = await import('../../../shared/utils/logger');
    return mod.logger;
  }

  it('should output timestamp, level, message, and context for info()', async () => {
    const logger = await getLogger();
    logger.info('test message', { key: 'val' });

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    const output = consoleSpy.log.mock.calls[0][0] as string;
    expect(output).toContain('INFO');
    expect(output).toContain('test message');
    expect(output).toContain('key');
    expect(output).toContain('val');
    // Should contain ISO-like timestamp
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should output timestamp, level, message, and context for warn()', async () => {
    const logger = await getLogger();
    logger.warn('warning message', { reason: 'timeout' });

    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    const output = consoleSpy.warn.mock.calls[0][0] as string;
    expect(output).toContain('WARN');
    expect(output).toContain('warning message');
    expect(output).toContain('reason');
    expect(output).toContain('timeout');
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should output timestamp, level, message, and context for error()', async () => {
    const logger = await getLogger();
    logger.error('error occurred', { code: 'SPAWN_FAILED' });

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    const output = consoleSpy.error.mock.calls[0][0] as string;
    expect(output).toContain('ERROR');
    expect(output).toContain('error occurred');
    expect(output).toContain('code');
    expect(output).toContain('SPAWN_FAILED');
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should output debug messages when NODE_ENV is not production', async () => {
    process.env.NODE_ENV = 'development';
    const logger = await getLogger();
    logger.debug('debug info', { step: 1 });

    expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
    const output = consoleSpy.debug.mock.calls[0][0] as string;
    expect(output).toContain('DEBUG');
    expect(output).toContain('debug info');
  });

  it('should suppress debug messages when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    const logger = await getLogger();
    logger.debug('should not appear', { hidden: true });

    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });

  it('should handle missing context object gracefully', async () => {
    const logger = await getLogger();
    logger.info('no context');

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    const output = consoleSpy.log.mock.calls[0][0] as string;
    expect(output).toContain('INFO');
    expect(output).toContain('no context');
  });

  it('should handle empty message string', async () => {
    const logger = await getLogger();
    logger.info('');

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
  });
});
