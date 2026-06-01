import { settingsSchema } from './settingsSchema'
import { coreSchema } from './coreSchema'

export const schemas = {
  ...settingsSchema,
  ...coreSchema
}