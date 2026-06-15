import { settingsSchema } from './settingsSchema'
import { coreSchema } from './coreSchema'
import { billingSchema } from './billingSchema'

export const schemas = {
  ...settingsSchema,
  ...coreSchema,
  ...billingSchema
}