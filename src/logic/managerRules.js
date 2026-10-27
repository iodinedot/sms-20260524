// src/logic/managerRules.js（純 JS）
import { validateBySchema } from './validation'

// 系統層：軟刪除 + 校區過濾
export const filterBaseList = (list, { schema, campusId }) => {
    const hasCampusField = !!schema?.fields?.campusId
    return (list || []).filter((item) => {
      if (item.dataStatus === 'deleted') return false
      if (hasCampusField && campusId && item.campusId !== campusId) return false
      return true
    })
  }
  
  // getLabel 由外部注入（它來自 useSettings）
  export const buildSearchText = (item, { schema, getLabel }) => {
    const keys = schema?.searchFields || Object.keys(schema?.fields ?? {})
    return keys
      .map((key) => {
        const field = schema.fields[key]
        if (!field) return ''
        return String(getLabel(field, item[key]) ?? '')
      })
      .join(' ')
  }
  
  const isEmptyFilter = (v) =>
    v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
  
  export const applyFilters = (items, activeFilters, schema) => {
    let result = items
    for (const [key, value] of Object.entries(activeFilters || {})) {
      if (isEmptyFilter(value)) continue
      if (!schema?.fields?.[key]) continue
      result = Array.isArray(value)
        ? result.filter((item) => value.includes(item[key]))
        : result.filter((item) => item[key] === value)
    }
    return result
  }
  
  export const createEmptyForm = (schema) => {
    if (!schema?.fields) return {}
    const obj = {}
    Object.entries(schema.fields).forEach(([key, field]) => {
      obj[key] = field.default ?? ''
    })
    return obj
  }
  
  export const buildCreateForm = ({ schema, initialData, campusId }) =>
    initialData
      ? { ...createEmptyForm(schema), ...initialData }
      : { ...createEmptyForm(schema), campusId }
  
  export const buildCopyForm = (item) => ({
    ...item,
    id: undefined,
    name: item.name + ' (copy)',
    schedules: item.schedules ? item.schedules.map((s) => ({ ...s })) : []
  })
  
  // validateBySchema 由外部注入
  export const validateForm = (form, { schema }) => {
    let errors = validateBySchema(form, schema.fields)
    if (schema?.validate) {
      errors = { ...errors, ...(schema.validate(form) || {}) }
    }
    return errors
  }
  
  export const prepareSavePayload = (form, isEditing) => {
    const payload = { ...form }
    if (isEditing) {
      return payload.id
        ? { ok: true, mode: 'update', payload }
        : { ok: false, reason: 'edit 沒 id' }
    }
    delete payload.id
    payload.dataStatus = payload.dataStatus || 'active'
    return { ok: true, mode: 'create', payload }
  }