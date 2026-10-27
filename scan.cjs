const fs = require('fs')
const path = require('path')

const re = /from ['"]vue['"]|from ['"]firebase|from ['"]@\/composables/

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) {
      walk(full)
    } else if (/\.js$/.test(f)) {
      fs.readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
        if (re.test(line)) console.log(full + ':' + (i + 1) + ': ' + line.trim())
      })
    }
  }
}

;['src/utils', 'src/constants', 'src/schemas', 'src/modules/billing']
  .filter((d) => fs.existsSync(d))
  .forEach(walk)