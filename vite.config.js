import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
   plugins: [vue()],
   resolve: {
    alias: [
      { find: '@/schemas',     replacement: r('./src/logic/schemas') },
      { find: '@/constants',   replacement: r('./src/logic/constants') },
      { find: '@/utils/lessonCalculator', replacement: r('./src/logic/lessonCalculator') },
      { find: '@/utils/formatters',       replacement: r('./src/logic/utils/formatters') },
      { find: '@/utils/fieldFilter',      replacement: r('./src/logic/utils/fieldFilter') },
      { find: '@/composables/validation', replacement: r('./src/logic/validation') },
      { find: '@/modules/billing/billingCalculator', replacement: r('./src/logic/billing/billingCalculator') },
      { find: '@', replacement: r('./src') }   // 這行一定要放最後
    ]
  }
})