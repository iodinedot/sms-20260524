export const indexById = (list) => {
  const map = {}
  for (const item of list || []) map[item.id] = item
  return map
}

export const lookupName = (maps, type, id) =>
  maps[type]?.[String(id)]?.name || '-'

// getList(type) 由外部注入，logic 不需要知道清單從哪來
export const resolveOptions = (field, { getList, schemas }) => {
  if (field.options) return field.options
  if (!field.optionsKey) return []

  const type = field.optionsKey
  const schema = schemas[type] || {}
  const labelKey = field.labelKey || schema.labelKey || 'name'
  const valueKey = field.valueKey || schema.valueKey || 'id'

  return (getList(type) || []).map((item) => ({
    label: item[labelKey],
    value: item[valueKey]
  }))
}

export const resolveLabel = (field, value, maps) => {
  if (value === undefined || value === null || value === '') return ''

  if (field.options) {
    const found = field.options.find((opt) => opt.value === value)
    return found ? found.label : value
  }

  if (field.optionsKey) {
    const map = maps[field.optionsKey]
    if (!map) return value
    return map[value]?.name || value
  }

  return value
}