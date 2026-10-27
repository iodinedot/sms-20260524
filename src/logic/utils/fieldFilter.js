// utils/fieldFilter.js

export const filterFields = (fields, modelValue, mode) => {
    return Object.entries(fields || {}).filter(([_, field]) => {
      if (!field) return false
  
      // system field
      if (field.hidden) return false
  
      // mode 控制
      if (mode === 'form' && field.showInForm === false) return false
      if (mode === 'table' && field.showInTable === false) return false
  
      // 條件顯示（form 用）
      if (field.showIf && !field.showIf(modelValue)) return false
      return true
    })
  }