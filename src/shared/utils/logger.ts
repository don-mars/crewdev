type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] ${level}: ${message}${contextStr}`;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (isProduction()) {
      return;
    }
    console.debug(formatEntry('DEBUG', message, context));
  },

  info(message: string, context?: LogContext): void {
    console.log(formatEntry('INFO', message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatEntry('WARN', message, context));
  },

  error(message: string, context?: LogContext): void {
    console.error(formatEntry('ERROR', message, context));
  },
};
