// composables/useSettings.js
import { ref, watch } from 'vue'
import { settingsSchema } from './settingsSchema'
import { useCrud } from './useCrud'

const crudMap = {}
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
  const getOptions = (type) => {
    const list = crudMap[type]?.list.value || []

    return list.map(item => ({
      label: item.name,
      value: item.id
    }))
  }

  return {
    getName,
    getOptions,
    maps
  }
}