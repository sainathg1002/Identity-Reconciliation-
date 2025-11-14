/**
 * Logger utility module
 * 
 * Provides structured logging for the identify-service.
 * Supports different log levels: debug, info, warn, error
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(level: LogLevel = "info") {
    this.logLevel = level;
  }

  /**
   * Log entry factory
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Skip if below configured log level
    if (this.levels[level] < this.levels[this.logLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
    };

    // Format output
    const output = this.format(entry);

    // Write to appropriate stream
    if (level === "error") {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Format log entry for display
   */
  private format(entry: LogEntry): string {
    const { timestamp, level, message, data } = entry;
    const levelUpper = level.toUpperCase().padEnd(5);
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] ${levelUpper} ${message}${dataStr}`;
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  /**
   * Warn level logging
   */
  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  /**
   * Error level logging
   */
  error(message: string, data?: any): void {
    this.log("error", message, data);
  }

  /**
   * Change log level
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Create default logger instance
const defaultLogLevel = (process.env.LOG_LEVEL || "info") as LogLevel;
export default new Logger(defaultLogLevel);
