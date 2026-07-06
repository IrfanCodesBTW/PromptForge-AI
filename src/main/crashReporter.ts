// ====================================================
// PromptForge AI — Crash Reporting & Exception Capture
// ====================================================

import { crashReporter } from 'electron'
import logger from '../shared/logger'

/**
 * Initialize crash reporting and uncaught exceptions/rejections capture.
 */
export function initializeCrashReporter(): void {
  try {
    // Start local crashReporter
    crashReporter.start({
      submitURL: 'http://localhost:9721/crash-report', // Placeholder URL
      uploadToServer: false,
      compress: true
    })
    logger.info('[CrashReporter] Native crash reporter initialized (local logging only)')
  } catch (error) {
    logger.error('[CrashReporter] Failed to start native crash reporter:', error)
  }

  // Intercept uncaught main process exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('[CrashReporter] Uncaught Exception in Main process:', {
      message: error.message,
      stack: error.stack
    })
  })

  // Intercept unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('[CrashReporter] Unhandled Rejection in Main process:', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    })
  })
}

/**
 * Register event listeners to handle renderer and plugin crash states.
 */
export function handleRendererCrashes(mainWindow: Electron.BrowserWindow): void {
  if (!mainWindow || !mainWindow.webContents) return

  // Log renderer process termination (crash, kill, out of memory, etc.)
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error('[CrashReporter] Renderer process terminated:', {
      reason: details.reason, // 'crashed', 'killed', 'oom', 'failed-to-launch', etc.
      exitCode: details.exitCode
    })
  })

  // Log helper process crashes (e.g. utility, GPU processes)
  mainWindow.webContents.on('child-process-gone', (_event, details) => {
    logger.warn('[CrashReporter] Child process terminated:', {
      type: details.type, // 'Utility', 'GPU', etc.
      reason: details.reason,
      exitCode: details.exitCode
    })
  })
}
