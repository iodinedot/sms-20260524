import { baseFields } from './baseSchemas'

// ---------------------------------------------------------
// 共用 schema factory
//
// collection 永遠自動 = type 自己的 key，不開放覆寫。
// 這樣「collection 打錯字撞到別的 type」這類 bug
// 從結構上就不可能發生，不用靠 code review 肉眼抓。
//
// 2026 更新：拿掉 org / campus scope 的區分。
// 目前的資料隔離邊界只在 organization 這一層（見 useCrud.js
// 的 `organizations/${ORGANIZATION_ID}/...` 路徑），同一個
// organization 底下的 campus 彼此不需要隔離，campusId 只是
// 一般的分類欄位，不再需要靠 scope 來決定 query 條件。
// ---------------------------------------------------------
export function defineSchema(type, config = {}) {
  return {
    idPrefix: config.idPrefix,
    collection: type,

    ...(config.title !== undefined && { title: config.title }),
    ...(config.emptyText !== undefined && { emptyText: config.emptyText }),
    ...(config.meta !== undefined && { meta: config.meta }),
    ...(config.pagination !== undefined && { pagination: config.pagination }),
    ...(config.labelKey !== undefined && { labelKey: config.labelKey }),
    ...(config.searchFields !== undefined && { searchFields: config.searchFields }),
    ...(config.validate !== undefined && { validate: config.validate }),
    ...(config.beforeSave !== undefined && { beforeSave: config.beforeSave }),
    ...(config.beforeDelete !== undefined && { beforeDelete: config.beforeDelete }),
    ...(config.guards !== undefined && { guards: config.guards }),
    ...(config.importConfig !== undefined && { importConfig: config.importConfig }),

    registerInSettings: config.registerInSettings === true,
    fields: {
      ...baseFields,
      ...config.fields
    },

    ui: config.ui
  }
}