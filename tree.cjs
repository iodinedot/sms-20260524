const fs = require('fs')
const path = require('path')

const IGNORE = new Set(['node_modules', '.git', 'dist'])

function walk(dir, prefix = '') {
  const entries = fs
    .readdirSync(dir)
    .filter((f) => !IGNORE.has(f))
    .sort((a, b) => {
      const da = fs.statSync(path.join(dir, a)).isDirectory()
      const db = fs.statSync(path.join(dir, b)).isDirectory()
      return da === db ? a.localeCompare(b) : da ? -1 : 1
    })

  entries.forEach((name, i) => {
    const full = path.join(dir, name)
    const last = i === entries.length - 1
    console.log(prefix + (last ? '└── ' : '├── ') + name)
    if (fs.statSync(full).isDirectory()) {
      walk(full, prefix + (last ? '    ' : '│   '))
    }
  })
}

console.log('src')
walk('src')