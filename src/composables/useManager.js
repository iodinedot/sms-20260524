// /composables/useManager.js
import { ref, computed, onMounted } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useSettings } from '@/composables/useSettings'
import { useSearch } from '@/composables/useSearch'
import { currentCampusId } from '@/composables/campusState'
import * as R from '@/logic/managerRules'

export function useManager({ type, schema, keyword }) {
  const { list, add, update, ensureSubscribed } = useCrud(type)

  // ensureSubscribed 冪等；沒被 useSettings 管理的 type 由各自的 manager 負責訂閱
  onMounted(() => ensureSubscribed())

  const { getLabel, crudMap } = useSettings()
  const isLoading = crudMap[type]?.isLoading

  // UI state
  const isOpen = ref(false)
  const isEditing = ref(false)
  const form = ref({})
  const errorFields = ref({})
  const activeFilters = ref({})

  // 資料管線：base → search → filters
  const baseList = computed(() =>
    R.filterBaseList(list.value, { schema, campusId: currentCampusId.value })
  )

  const searchedList = useSearch(
    baseList,
    keyword,
    (item) => R.buildSearchText(item, { schema, getLabel })
  )

  const dataFiltered = computed(() =>
    R.applyFilters(searchedList?.value || baseList.value || [], activeFilters.value, schema)
  )

  // modal control
  const openModal = (editing, formValue) => {
    form.value = formValue
    isEditing.value = editing
    errorFields.value = {}
    isOpen.value = true
  }

  const openCreate = (initialData = null) =>
    openModal(false, R.buildCreateForm({
      schema, initialData, campusId: currentCampusId.value
    }))

  const openEdit = (item) => openModal(true, { ...item })
  const openCopy = (item) => openCreate(R.buildCopyForm(item))
  const close = () => { isOpen.value = false }

  const validate = () => {
    errorFields.value = R.validateForm(form.value, { schema })   // 不用再傳 validateBySchema
    return Object.keys(errorFields.value).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      console.warn('[useManager] ❌ validation failed', errorFields.value)
      return false
    }

    const plan = R.prepareSavePayload(form.value, isEditing.value)
    if (!plan.ok) {
      console.error('❌', plan.reason)
      return false
    }

    if (plan.mode === 'update') {
      await update({ id: plan.payload.id, item: plan.payload })
    } else {
      await add(plan.payload)
    }

    isOpen.value = false
    return true
  }

  const updateField = (field, value) => {
    form.value = { ...form.value, [field]: value }
  }

  return {
    list, isLoading, activeFilters, dataFiltered,
    form, isOpen, isEditing,
    keyword,
    errorFields, validate,
    openCreate, openEdit, openCopy, close, handleSave,
    updateField
  }
}