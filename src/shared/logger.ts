// ====================================================
// PromptForge AI — Process-Safe Structured Logger
// ====================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  process: 'main' | 'renderer' | 'preload'
  timestamp: string
  message: string
  meta?: unknown
}

const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

class Logger {
  private isMain: boolean
  private logPath: string = ''
  private fs: typeof import('fs') | null = null
  private path: typeof import('path') | null = null

  constructor() {
    this.isMain = typeof window === 'undefined'
    if (this.isMain) {
      try {
        this.fs = require('fs')
        this.path = require('path')
        this.getLogPath()
      } catch (err) {
        console.error('[Logger] Failed to initialize main process logger:', err)
      }
    }
  }

  private getLogPath(): string {
    if (this.logPath) return this.logPath
    if (!this.isMain || !this.fs || !this.path) return ''
    try {
      let app: any
      try {
        app = require('electron').app
      } catch {
        // Safe catch
      }
      if (!app) {
        app = (global as any).__mock_electron_app__ || (globalThis as any).__mock_electron_app__
      }
      if (app) {
        const logsDir = this.path.join(app.getPath('userData'), 'logs')
        if (!this.fs.existsSync(logsDir)) {
          this.fs.mkdirSync(logsDir, { recursive: true })
        }
        this.logPath = this.path.join(logsDir, 'app.log')
      }
    } catch (err) {
      console.error('[Logger] Failed to resolve log path:', err)
    }
    return this.logPath
  }

  /**
   * Log a debug level message
   */
  debug(message: string, meta?: unknown): void {
    this.write('debug', message, meta)
  }

  /**
   * Log an info level message
   */
  info(message: string, meta?: unknown): void {
    this.write('info', message, meta)
  }

  /**
   * Log a warning level message
   */
  warn(message: string, meta?: unknown): void {
    this.write('warn', message, meta)
  }

  /**
   * Log an error level message
   */
  error(message: string, meta?: unknown): void {
    this.write('error', message, meta)
  }

  /**
   * Write log entry
   */
  private write(level: LogLevel, message: string, meta?: unknown): void {
    const entry: LogEntry = {
      level,
      process: this.isMain ? 'main' : 'renderer',
      timestamp: new Date().toISOString(),
      message,
      meta
    }

    // Format console output beautifully
    const colorCode = this.getConsoleColor(level)
    const resetCode = '\x1b[0m'
    const consoleMsg = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.process.toUpperCase()}] ${entry.message}`

    if (entry.meta) {
      console.log(`${colorCode}${consoleMsg}${resetCode}`, entry.meta)
    } else {
      console.log(`${colorCode}${consoleMsg}${resetCode}`)
    }

    if (this.isMain) {
      this.writeToLogFile(entry)
    } else {
      // In renderer, send via IPC to Main to write it to disk
      try {
        if (window.api && typeof window.api.send === 'function') {
          window.api.send('promptforge:app:log', entry)
        }
      } catch {
        // Fallback if IPC is not yet initialized
      }
    }
  }

  /**
   * Write structured log to file with rotation support (Main process only)
   */
  writeToLogFile(entry: LogEntry): void {
    const logPath = this.getLogPath()
    if (!this.isMain || !this.fs || !logPath) return

    try {
      // Perform log rotation if file exceeds 5MB
      if (this.fs.existsSync(logPath)) {
        const stats = this.fs.statSync(logPath)
        if (stats.size > MAX_LOG_SIZE_BYTES) {
          const archivePath = logPath.replace('.log', `.old.log`)
          if (this.fs.existsSync(archivePath)) {
            this.fs.unlinkSync(archivePath)
          }
          this.fs.renameSync(logPath, archivePath)
        }
      }

      // Format metadata safely
      let metaStr = ''
      if (entry.meta) {
        if (entry.meta instanceof Error) {
          metaStr = ` | Error: ${entry.meta.message} | Stack: ${entry.meta.stack}`
        } else {
          try {
            metaStr = ` | Meta: ${JSON.stringify(entry.meta)}`
          } catch {
            metaStr = ' | Meta: [Unserializable]'
          }
        }
      }

      const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.process.toUpperCase()}] ${entry.message}${metaStr}\n`
      this.fs.appendFileSync(logPath, logLine, 'utf8')
    } catch (err) {
      console.error('[Logger] Failed to write to log file:', err)
    }
  }

  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '\x1b[90m' // Gray
      case 'info':
        return '\x1b[32m' // Green
      case 'warn':
        return '\x1b[33m' // Yellow
      case 'error':
        return '\x1b[31m' // Red
      default:
        return ''
    }
  }
}

export const logger = new Logger()
export default logger
