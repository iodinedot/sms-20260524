// composables/useSettings.js
import { ref, watch, onMounted } from 'vue'
import { settingsSchema } from '@/schemas/settingsSchema'
import { useCrud } from './useCrud'

let isInitialized = false
const crudMap = {}

Object.keys(settingsSchema).forEach(type => {
  crudMap[type] = useCrud(type)
})

const maps = ref({})

// 🔥 建立 map
const buildMap = (list) => {
  const map = {}
  list.forEach(item => {
    map[item.id] = item.name
  })
  return map
}

// 🔥 建立全部 map
const buildAllMaps = () => {
  const result = {}

  Object.entries(crudMap).forEach(([type, crud]) => {
    result[type] = buildMap(crud.list.value)
  })

  maps.value = result
}

export function useSettings() {
  onMounted(() => {
    if (!isInitialized) {
      Object.values(crudMap).forEach(c => c.subscribe())
      isInitialized = true
    }
  })

  watch(
    () => Object.keys(crudMap).map(type => crudMap[type].list.value),
    () => {
      buildAllMaps()
    },
    { deep: true, immediate: true }
  )

  // 🔥 名稱
  const getName = (type, id) => {
    if (!maps.value[type]) return '-'
    return maps.value[type][String(id)] || '-'
  }

  // 🔥 options（🔥 UI 會用）
  const getOptions = (field) => {
    if (field.options) return field.options
    
    if (field.optionsKey) {
      const type = field.optionsKey
      const list = crudMap[type]?.list.value || []
  
      // 🔥 從 schema 讀
      const schema = settingsSchema[type] || {}
  
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
  
    // 1️⃣ 靜態 options（直接用你原本資料）
    if (field.options) {
      const found = field.options.find(opt => opt.value === value)
      return found ? found.label : value
    }
  
    // 2️⃣ 動態 options（🔥 重點：用 maps，不要用 list）
    if (field.optionsKey) {
      const map = maps[field.optionsKey]
      if (!map) return value
  
      const item = map[value]
      if (!item) return value
  
      const labelKey = field.labelKey || 'name'
      return item[labelKey] || value
    }
  
    return value
  }
  
  return {
    getName,
    getOptions,
    getLabel,
    maps
  }
}