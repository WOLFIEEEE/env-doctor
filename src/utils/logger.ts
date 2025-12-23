import pc from 'picocolors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

class Logger {
  private level: LogLevel = 'info';
  private verbose = false;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  setVerbose(verbose: boolean) {
    this.verbose = verbose;
    if (verbose) {
      this.level = 'debug';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  debug(...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.log(pc.gray('[debug]'), ...args);
    }
  }

  info(...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.log(...args);
    }
  }

  success(...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.log(pc.green('✓'), ...args);
    }
  }

  warn(...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.log(pc.yellow('⚠'), ...args);
    }
  }

  error(...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error(pc.red('✗'), ...args);
    }
  }

  /** Print without any prefix */
  log(...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.log(...args);
    }
  }

  /** Print a blank line */
  blank() {
    if (this.shouldLog('info')) {
      console.log();
    }
  }

  /** Print a header */
  header(text: string) {
    if (this.shouldLog('info')) {
      console.log();
      console.log(pc.bold(pc.cyan(text)));
      console.log();
    }
  }

  /** Print a section divider */
  divider() {
    if (this.shouldLog('info')) {
      console.log(pc.gray('─'.repeat(50)));
    }
  }
}

export const logger = new Logger();

