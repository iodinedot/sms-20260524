// /composables/useManager.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCrud } from '@/composables/useCrud'

export function useManager(options) {
  const {
    type,
    schema,
    useSearch = false,
    customFilter = null
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
      item.status !== 'deleted'
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
  const dataFiltered = computed(() => {
    if (!customFilter) return searchedList.value
    return customFilter(searchedList.value)
  })

  // 🧠 modal control
  const openCreate = () => {
    form.value = createEmptyForm()
    isEditing.value = false
    errorFields.value = {}
    isOpen.value = true
  }

  const openEdit = (item) => {
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

  // 🧠 validation
  const validate = () => {
    if (!schema?.validate) return true
  
    const errors = schema.validate(form.value) || {}
    errorFields.value = errors
  
    return Object.values(errors).every(v => !v)
  }

  // 🧠 save（核心統一）
  const handleSave = async () => {
    const payload = { ...form.value }
    //console.log('form before save:', payload)
    if (isEditing.value) {
      if (!payload.id) {
        console.error('❌ edit 沒 id')
        return
      }
      await update(payload)
    } else {
      delete payload.id   // 🔥 防止 copy 殘留
      payload.status = payload.status || 'active'
      await add(payload)
    }
  
    isOpen.value = false
  }

  return {
    // data
    list,
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