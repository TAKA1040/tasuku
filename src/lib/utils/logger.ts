/**
 * Logger utility for conditional logging based on environment
 *
 * Usage:
 * import { logger } from '@/lib/utils/logger'
 *
 * logger.debug('Debug message', { data })  // Only in development
 * logger.info('Info message')              // Only in development
 * logger.warn('Warning message')           // Always shown
 * logger.error('Error message', error)     // Always shown
 */

type _LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Debug level logging - only in development
   * Use for detailed debugging information
   */
  debug(message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }

  /**
   * Info level logging - only in development
   * Use for general informational messages
   */
  info(message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args)
    }
  }

  /**
   * Warning level logging - always shown
   * Use for potentially problematic situations
   */
  warn(message: string, ...args: unknown[]) {
    console.warn(`[WARN] ${message}`, ...args)
  }

  /**
   * Error level logging - always shown
   * Use for error conditions
   */
  error(message: string, ...args: unknown[]) {
    console.error(`[ERROR] ${message}`, ...args)
  }

  /**
   * Group logging - only in development
   * Use for grouping related logs together
   */
  group(label: string, callback: () => void) {
    if (this.isDevelopment) {
      console.group(label)
      callback()
      console.groupEnd()
    }
  }

  /**
   * Table logging - only in development
   * Use for displaying tabular data
   */
  table(data: unknown) {
    if (this.isDevelopment) {
      console.table(data)
    }
  }
}

export const logger = new Logger()
