// composables/useValidation.js

export const validateBySchema = (form, fields) => {
  const errors = {}

  Object.entries(fields).forEach(([key, field]) => {
    const value = form[key]

    // ===== 1️⃣ required =====
    if (field.required) {
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)

      if (isEmpty) {
        errors[key] = `${field.label}為必填`
        return
      }
    }

    // ===== 2️⃣ number =====
    if (field.type === 'number') {
      if (value !== '' && value !== null && value !== undefined) {
        const num = Number(value)

        if (isNaN(num)) {
          errors[key] = `${field.label}需為數字`
          return
        }

        if (field.min !== undefined && num < field.min) {
          errors[key] = `${field.label}需 ≥ ${field.min}`
          return
        }

        if (field.max !== undefined && num > field.max) {
          errors[key] = `${field.label}需 ≤ ${field.max}`
          return
        }
      }

      if (field.type === 'period') {
        const { start, end } = value || {}
      
        if (!start || !end) {
          errors[key] = `${field.label} 需完整填寫`
          return
        }
      
        if (start > end) {
          errors[key] = `${field.label} 開始不可晚於結束`
          return
        }
      }
    }

    // ===== 3️⃣ 自訂 rules =====
    if (field.rules && Array.isArray(field.rules)) {
      for (const rule of field.rules) {
        if (rule.type === 'min' && value < rule.value) {
          errors[key] = rule.message
          break
        }

        if (rule.type === 'max' && value > rule.value) {
          errors[key] = rule.message
          break
        }

        if (rule.type === 'required' && !value) {
          errors[key] = rule.message
          break
        }
      }
    }
  })

  return errors
}
