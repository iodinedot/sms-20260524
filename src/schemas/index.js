// schemas/index.js
import { settingsSchema } from './settingsSchema'
import { coreSchema } from './coreSchema'
import { billingSchema } from './billingSchema'

function validateSchema(type, schema) {
  const missing = []

  if (!schema.collection) missing.push('collection')

  if (missing.length) {
    throw new Error(`[schema:${type}] 缺少必要欄位: ${missing.join(', ')}`)
  }
}

export const schemas = {
  ...settingsSchema,
  ...coreSchema,
  ...billingSchema
}

// 合併完成後,對每一個 type 立刻驗證,壞掉的 schema 在 app 啟動時就會炸出來
Object.entries(schemas).forEach(([type, schema]) => validateSchema(type, schema))