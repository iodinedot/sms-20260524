// /composables/useManager.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { validateBySchema } from '@/composables/useValidation'

export function useManager(options) {
  const {
    type,
    schema,
    useSearch = false
  } = options

  // 🔥 data layer
  const {
    list,
    add,
    update,
    remove
  } = useCrud(type)

  // 🧠 UI state（集中）
  const isOpen = ref(false)
  const isEditing = ref(false)
  const form = ref({})

  // 🧠 validation
  const errorFields = ref({})

  // 🧠 search（簡化版）
  const keyword = ref('')

  // 🔥 Layer 1：系統層（soft delete）
  const baseList = computed(() => {
    return (list.value || []).filter(item =>
      item.dataStatus !== 'deleted'
    )
  })
  
  // 🔥 Layer 2：search（用 schema）
  const searchedList = computed(() => {
    if (!useSearch || !keyword.value) return baseList.value

    const kw = keyword.value.toLowerCase()

    const searchableFields = Object.entries(schema.fields)
      .filter(([_, f]) => f.searchable !== false)
      .map(([key]) => key)

    return baseList.value.filter(item =>
      searchableFields.some(key =>
        String(item[key] ?? '').toLowerCase().includes(kw)
      )
    )
  })

  // 🔥 Layer 3：客製 filter
  const activeFilters = ref({})
  const dataFiltered = computed(() => {
    let result = searchedList.value
  
    // 🔥 Step 3：schema-driven filters
    if (schema?.filters && Object.keys(activeFilters.value || {}).length) {
      Object.entries(activeFilters.value).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
  
        const filterDef = schema.filters[key]
        if (!filterDef?.filter) return
  
        result = result.filter(item =>
          filterDef.filter(item, value)
        )
      })
    }
  
    return result
  })

  // 🧠 modal control
  const openCreate = () => {
    form.value = createEmptyForm()
    isEditing.value = false
    errorFields.value = {}
    isOpen.value = true
  }

  const openEdit = (item) => {
    console.log("useManager openEdit")
    form.value = { ...item }
    isEditing.value = true
    errorFields.value = {}
    isOpen.value = true
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
    errors = validateBySchema(form.value, schema)
  
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
    console.log('[useManager] form before validate:', payload)
    
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

  return {
    // data
    list,
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
    close,
    handleSave
  }
}