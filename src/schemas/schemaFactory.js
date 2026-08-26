import { baseFields } from './baseSchemas'

// ---------------------------------------------------------
// 共用 schema factory
//
// collection 永遠自動 = type 自己的 key，不開放覆寫。
// 這樣「collection 打錯字撞到別的 type」這類 bug
// 從結構上就不可能發生，不用靠 code review 肉眼抓。
// ---------------------------------------------------------
function defineSchema(type, scope, config = {}) {
  return {
    idPrefix: config.idPrefix,
    collection: type,
    scope,

    ...(config.title !== undefined && { title: config.title }),
    ...(config.emptyText !== undefined && { emptyText: config.emptyText }),
    ...(config.meta !== undefined && { meta: config.meta }),
    ...(config.pagination !== undefined && { pagination: config.pagination }),
    ...(config.labelKey !== undefined && { labelKey: config.labelKey }),
    ...(config.searchFields !== undefined && { searchFields: config.searchFields }),
    ...(config.validate !== undefined && { validate: config.validate }),
    ...(config.beforeSave !== undefined && { beforeSave: config.beforeSave }),
    ...(config.importConfig !== undefined && { importConfig: config.importConfig }),

    // 這個 type 是否要被 useSettings 當全域參照表訂閱（optionsKey / getName / getLabel 用）。
    // 預設 false——大型或 campus-scoped 的業務資料（students/courses/billings...）
    // 不該被全域常駐訂閱，只有小型參照表才需要明確打開這個開關。
    registerInSettings: config.registerInSettings === true,
    // 每個 type 都強制合併 baseFields，不再靠個別檔案自己記得寫
    fields: {
      ...baseFields,
      ...config.fields
    },

    ui: config.ui
  }
}

export const defineOrgSchema = (type, config) => defineSchema(type, 'org', config)
export const defineCampusSchema = (type, config) => defineSchema(type, 'campus', config)