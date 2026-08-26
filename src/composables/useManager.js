// /composables/useManager.js
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useSettings } from '@/composables/useSettings'
import { useSearch } from '@/composables/useSearch'
import { validateBySchema } from '@/composables/useValidation'

export function useManager(options) {
  const {
    type,
    schema,
    keyword
  } = options

  // 🔥 data layer
  const {
    list,
    add,
    update,
    remove,
    ensureSubscribed
  } = useCrud(type)

    // registerInSettings 的 type 已經由 useSettings 統一訂閱了，
  // 這裡再訂一次不會壞（ensureSubscribed 是冪等的），
  // 但寫在這裡是為了涵蓋「沒有被 useSettings 管理」的 type
  // （students / courses / enrollments / billings 等）——
  // 它們的訂閱責任本來就該落在各自使用它們的 useManager 身上。
  onMounted(() => {
    ensureSubscribed()
  })


const { getLabel, crudMap } = useSettings()

// isLoading 用同一個 singleton instance(useCrud 內部有快取,拿到的是同一個)
const isLoading = crudMap[type]?.isLoading

// 🧠 UI state（集中）
const isOpen = ref(false)
const isEditing = ref(false)
const form = ref({})

// 🧠 validation
const errorFields = ref({})

// 🔥 Layer 1：系統層（soft delete）
const baseList = computed(() => {
  return (list.value || []).filter(item =>
    item.dataStatus !== 'deleted'
  )
})

// 🔥 Layer 2：search（schema-driven）
const getSearchText = (item) => {
  const fields =
    schema?.searchFields
    || Object.keys(schema?.fields ?? {})

  return fields
    .map(key => {
      const field = schema.fields[key]
      if (!field) return ''

      const raw = item[key]

      // 🔥 關鍵：一定要轉成字串
      const value = getLabel(field, raw)
      //console.log('useManager getSearchText: ', value)
      return String(value ?? '')
    })
    .join(' ')
}

const searchedList = useSearch(
  baseList,
  keyword,
  getSearchText
)

// 🔥 Layer 3：schema-driven filters
const activeFilters = ref({})

const dataFiltered = computed(() => {
  const base = searchedList?.value || baseList.value || []
  let result = base

  if (!Object.keys(activeFilters.value).length) {
    return result
  }

  Object.entries(activeFilters.value).forEach(([key, value]) => {

    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return
    }

    const field = schema?.fields?.[key]
    if (!field) return

    if (Array.isArray(value)) {
      result = result.filter(item =>
        value.includes(item[key])
      )
      return
    }

    result = result.filter(item =>
      item[key] === value
    )
  })

  return result
})

  // 🧠 modal control
  const openCreate = (initialData = null) => {
    form.value = initialData
      ? { ...createEmptyForm(), ...initialData }
      : createEmptyForm()
  
    isEditing.value = false
    errorFields.value = {}
    isOpen.value = true
  }

  const openEdit = (item) => {
    //console.log('openEdit item:', item)
  
    form.value = { ...item }
    isEditing.value = true
    errorFields.value = {}
    isOpen.value = true
  }

  const openCopy = (item) => {
    openCreate({
      ...item,
      id: undefined,
      name: item.name + ' (copy)',
  
      // ⭐ 避免 reference 問題
      schedules: item.schedules
        ? item.schedules.map(s => ({ ...s }))
        : []
    })
  }

  const close = () => {
    isOpen.value = false
  }

  // 🧠 create empty form
  const createEmptyForm = () => {
    if (!schema?.fields) return {}

    const obj = {}
    Object.entries(schema.fields).forEach(([key, field]) => {
      obj[key] = field.default ?? ''
    })
    return obj
  }

  const validate = () => {
    let errors = {}
  
    // 🔥 通用 validation
    //console.log('[useManager] schema:', schema)
    errors = validateBySchema(form.value, schema.fields)
  
    // 🔥 schema 客製（補充）
    if (schema?.validate) {
      const customErrors = schema.validate(form.value) || {}
      errors = { ...errors, ...customErrors }
    }
  
    errorFields.value = errors
  
    return Object.keys(errors).length === 0
  }
  
  // 🧠 save（核心統一）
  const handleSave = async () => {
    const payload = { ...form.value }
    //console.log('[useManager] form before validate:', payload)
    
    if (!validate()) {
      console.warn('[useManager] ❌ validation failed', errorFields.value)
      return
    }
    
    console.log('[useManager] form before save:', payload)
    if (isEditing.value) {
      if (!payload.id) {
        console.error('❌ edit 沒 id')
        return
      }
      await update({
        id: payload.id,
        item: payload
      })
    } else {
      delete payload.id   // 🔥 防止 copy 殘留
      payload.dataStatus = payload.dataStatus || 'active'
      await add(payload)
    }
  
    isOpen.value = false
  }

  const updateField = (field, value) => {
    form.value = {
      ...form.value,
      [field]: value
    }
  }

  return {
    // data
    list,
    isLoading,
    activeFilters,
    dataFiltered,

    // UI state
    form,
    isOpen,
    isEditing,

    // search
    keyword,

    // validation
    errorFields,
    validate,

    // actions
    openCreate,
    openEdit,
    openCopy,
    close,
    handleSave,

    updateField
  }
}