#!/usr/bin/env node
// pnpm module resolution Electron built-in require-ni shadow qilmasligi uchun
// minimal env bilan ishga tushiramiz
const electronPath = require('electron')
const { spawn } = require('child_process')

const KEEP = ['HOME', 'PATH', 'DISPLAY', 'TMPDIR', 'TEMP', 'TMP', 'USER', 'LOGNAME',
              'LANG', 'LC_ALL', 'LC_CTYPE', 'XDG_RUNTIME_DIR', 'DBUS_SESSION_BUS_ADDRESS']
const env = {}
for (const k of KEEP) if (process.env[k] != null) env[k] = process.env[k]
env.NODE_ENV = process.env.NODE_ENV || 'development'

const child = spawn(electronPath, ['.'], { stdio: 'inherit', env })
child.on('close', (code) => process.exit(code ?? 0))
