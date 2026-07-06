// ====================================================
// PromptForge AI — System & Environment Doctor
// ====================================================
// Validates Node, SQLite, database integrity, environment variables,
// and system write access permissions. Runs via `npm run doctor`.

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { envSchema } from '../src/shared/env'
import initSqlJs from 'sql.js'

async function runDoctor() {
  console.log('\n⚡ PromptForge AI — Application Doctor')
  console.log('====================================\n')

  let hasErrors = false

  function printResult(check: string, success: boolean, detail?: string) {
    if (success) {
      console.log(`  \x1b[32m✔\x1b[0m ${check} ${detail ? `\x1b[90m(${detail})\x1b[0m` : ''}`)
    } else {
      console.log(`  \x1b[31m✘\x1b[0m ${check} ${detail ? `\x1b[31m- ${detail}\x1b[0m` : ''}`)
      hasErrors = true
    }
  }

  // 1. Node version check
  try {
    const nodeVer = process.version
    const major = parseInt(nodeVer.replace('v', '').split('.')[0], 10)
    printResult('Node.js Version Check', major >= 20, `${nodeVer} (Requires >= v20.0.0)`)
  } catch (err: any) {
    printResult('Node.js Version Check', false, err.message)
  }

  // 2. npm version check
  try {
    const npmVer = execSync('npm -v', { encoding: 'utf8' }).trim()
    const major = parseInt(npmVer.split('.')[0], 10)
    printResult('npm Version Check', major >= 9, `${npmVer} (Requires >= v9.0.0)`)
  } catch (err: any) {
    printResult('npm Version Check', false, err.message)
  }

  // 3. Environment Variables validation
  try {
    // Load .env file manually if exists
    const envPath = path.join(__dirname, '../.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
          const key = match[1]
          let value = match[2] || ''
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
          process.env[key] = value
        }
      })
    }

    const result = envSchema.safeParse(process.env)
    if (result.success) {
      printResult('Environment Variables Validation', true, 'Parsed configuration successfully')
    } else {
      printResult(
        'Environment Variables Validation',
        false,
        JSON.stringify(result.error.format())
      )
    }
  } catch (err: any) {
    printResult('Environment Variables Validation', false, err.message)
  }

  // 4. SQLite WASM engine initialization
  try {
    const SQL = await initSqlJs()
    const db = new SQL.Database()
    db.run('CREATE TABLE doctor_test (id INTEGER PRIMARY KEY, value TEXT)')
    db.run('INSERT INTO doctor_test (value) VALUES (?)', ['working'])
    const res = db.exec('SELECT value FROM doctor_test')[0].values[0][0]
    db.close()

    printResult('SQLite Engine Check (sql.js)', res === 'working', 'WASM SQLite compiles and executes queries successfully')
  } catch (err: any) {
    printResult('SQLite Engine Check (sql.js)', false, err.message)
  }

  // 5. Database Integrity check
  try {
    // Determine path of SQLite database in UserData directory (check platform defaults)
    let userDataDir = ''
    const appName = 'promptforge-ai'
    if (process.platform === 'win32') {
      userDataDir = path.join(process.env.APPDATA || '', appName)
    } else if (process.platform === 'darwin') {
      userDataDir = path.join(process.env.HOME || '', 'Library/Application Support', appName)
    } else {
      userDataDir = path.join(process.env.HOME || '', '.config', appName)
    }

    const dbFilePath = path.join(userDataDir, 'promptforge.db')
    if (fs.existsSync(dbFilePath)) {
      const buffer = fs.readFileSync(dbFilePath)
      const SQL = await initSqlJs()
      const db = new SQL.Database(buffer)
      const res = db.exec('PRAGMA integrity_check')[0].values[0][0]
      db.close()
      printResult('Database Integrity Check', res === 'ok', `Status: ${res} at ${dbFilePath}`)
    } else {
      printResult('Database Integrity Check', true, `Database not yet created at ${dbFilePath} (will create on first run)`)
    }
  } catch (err: any) {
    printResult('Database Integrity Check', false, err.message)
  }

  // 6. Write permissions check
  try {
    const testFile = path.join(__dirname, '../.doctor-write-test')
    fs.writeFileSync(testFile, 'test', 'utf8')
    fs.unlinkSync(testFile)
    printResult('Write Access check (Workspace)', true, 'Read/Write permissions ok')
  } catch (err: any) {
    printResult('Write Access check (Workspace)', false, err.message)
  }

  // 7. Check logs directory write access
  try {
    let userDataDir = ''
    const appName = 'promptforge-ai'
    if (process.platform === 'win32') {
      userDataDir = path.join(process.env.APPDATA || '', appName)
    } else if (process.platform === 'darwin') {
      userDataDir = path.join(process.env.HOME || '', 'Library/Application Support', appName)
    } else {
      userDataDir = path.join(process.env.HOME || '', '.config', appName)
    }
    const logsDir = path.join(userDataDir, 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
    const testFile = path.join(logsDir, '.write-test')
    fs.writeFileSync(testFile, 'test', 'utf8')
    fs.unlinkSync(testFile)
    printResult('Write Access check (App logs directory)', true, `Read/Write permissions ok at ${logsDir}`)
  } catch (err: any) {
    printResult('Write Access check (App logs directory)', false, err.message)
  }

  console.log('\n====================================')
  if (hasErrors) {
    console.log('\x1b[31m❌ Doctor failed: One or more checks returned errors.\x1b[0m\n')
    process.exit(1)
  } else {
    console.log('\x1b[32m✔ Doctor passed: Workspace and system environments are healthy!\x1b[0m\n')
  }
}

runDoctor()
