// composables/useSettings.js
import { ref, watch } from 'vue'
import { schemas } from '@/schemas'   // ⭐ 改成完整 schemas,不再只用 settingsSchema
import { useCrud } from './useCrud'

let isInitialized = false
let isWatching = false
const crudMap = {}

// 只訂閱明確標記 registerInSettings: true 的 type。
// students / courses / enrollments / billings 這類大型或 campus-scoped
// 業務資料不在這裡出現——它們該由各自頁面自己 useCrud(type) 局部訂閱。
Object.entries(schemas)
  .filter(([, schema]) => schema.registerInSettings)
  .forEach(([type]) => {
    crudMap[type] = useCrud(type)
  })

const maps = ref({})

const initSettings = () => {
  if (isInitialized) return

  console.log('[useSettings] initSettings')
  Object.values(crudMap).forEach(c => c.subscribe())
  isInitialized = true
}

const buildMap = (list) => {
  const map = {}
  list.forEach(item => {
    map[item.id] = item
  })
  return map
}

const initWatch = () => {
  if (isWatching) return
  
  // 每個 type 各自一個 watcher，依賴只有自己的 list.value
  // → semesters 寫入只會重建 maps.value.semesters，不會碰到別的 type
  Object.entries(crudMap).forEach(([type, crud]) => {
    watch(
      () => crud.list.value,
      (newList) => {
        maps.value = {
          ...maps.value,
          [type]: buildMap(newList)
        }
      },
      { immediate: true }
    )
  })

  isWatching = true
}

export function useSettings() {
  initWatch()
  initSettings()

  const getName = (type, id) => {
    const item = maps.value[type]?.[String(id)]
    return item?.name || '-'
  }

  const getOptions = (field) => {
    if (field.options) return field.options

    if (field.optionsKey) {
      const type = field.optionsKey
      const list = crudMap[type]?.list.value || []

      // ⭐ 這裡改讀完整 schemas,而不是 settingsSchema
      const schema = schemas[type] || {}

      const labelKey = field.labelKey || schema.labelKey || 'name'
      const valueKey = field.valueKey || schema.valueKey || 'id'

      return list.map(item => ({
        label: item[labelKey],
        value: item[valueKey]
      }))
    }

    return []
  }

  const getLabel = (field, value) => {
    if (value === undefined || value === null || value === '') return ''

    if (field.options) {
      const found = field.options.find(opt => opt.value === value)
      return found ? found.label : value
    }

    if (field.optionsKey) {
      const map = maps.value[field.optionsKey]
      if (!map) return value

      const item = map[value]
      return item?.name || value
    }

    return value
  }

  return {
    getName,
    getOptions,
    getLabel,
    maps,
    crudMap   // ⭐ 順便 expose 出去,useManager 會用到(見下方)
  }
}