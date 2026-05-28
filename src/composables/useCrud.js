// composables/useCrud.js
import { computed } from 'vue'
import { useSettings } from './useSettings'
import { settingsSchema } from './settingsSchema'

export function useCrud(type) {
  const { settings, saveSettings } = useSettings()

  const schema = settingsSchema[type]

  if (!schema) {
    console.error(`[useCrud] Unknown type: ${type}`)
  }

  // 🔥 list
  const list = computed(() => {
    return settings.value?.[type] || []
  })

  // 🔥 建立空物件（核心升級）
  const createEmpty = () => {
    const obj = { id: '' }
  
    Object.entries(schema.fields).forEach(([key, field]) => {
      obj[key] = field.default
    })
  
    return obj
  }

  // 🔥 id
  const generateId = () => {
    return `${schema.idPrefix}${Date.now()}`
  }

  // 🔥 新增
  const add = async (item) => {
    if (!settings.value) return

    const newItem = {
      id: generateId(),
      ...item
    }

    const newList = [...list.value, newItem]

    settings.value[type] = newList
    await saveSettings()

    return newItem
  }

  // 🔥 更新
  const update = async (item) => {
    if (!settings.value || !item?.id) return

    const index = list.value.findIndex(i => i.id === item.id)
    if (index === -1) return

    const newList = [...list.value]
    newList[index] = { ...item }

    settings.value[type] = newList
    await saveSettings()
  }

  // 🔥 刪除
  const remove = async (id) => {
    if (!settings.value) return

    const newList = list.value.filter(i => i.id !== id)

    settings.value[type] = newList
    await saveSettings()
  }

  // 🔥 批次覆蓋（排序用）
  const setList = async (newList) => {
    if (!settings.value) return

    settings.value[type] = [...newList]
    await saveSettings()
  }

  return {
    list,
    add,
    update,
    remove,
    setList,
    createEmpty
  }
}