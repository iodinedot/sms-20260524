import { ref, watch } from 'vue'
import { schemas } from '@/schemas'
import { useCrud } from './useCrud'
import { indexById, lookupName, resolveOptions, resolveLabel } from '@/logic/settingsLookup'

let isInitialized = false
let isWatching = false
const crudMap = {}

// 只訂閱 registerInSettings: true 的 type；業務資料由各自頁面局部訂閱
Object.entries(schemas)
  .filter(([, schema]) => schema.registerInSettings)
  .forEach(([type]) => {
    crudMap[type] = useCrud(type)
  })

const maps = ref({})

const initSettings = () => {
  if (isInitialized) return
  Object.values(crudMap).forEach((c) => c.subscribe())
  isInitialized = true
}

const initWatch = () => {
  if (isWatching) return
  // 每個 type 各自一個 watcher，只重建自己的 map
  Object.entries(crudMap).forEach(([type, crud]) => {
    watch(
      () => crud.list.value,
      (newList) => {
        maps.value = { ...maps.value, [type]: indexById(newList) }
      },
      { immediate: true }
    )
  })
  isWatching = true
}

export function useSettings() {
  initWatch()
  initSettings()

  const getName = (type, id) => lookupName(maps.value, type, id)
  const getOptions = (field) =>
    resolveOptions(field, { getList: (type) => crudMap[type]?.list.value, schemas })
  const getLabel = (field, value) => resolveLabel(field, value, maps.value)

  return { getName, getOptions, getLabel, maps, crudMap }
}