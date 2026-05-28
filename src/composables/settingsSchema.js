// composables/settingsSchema.js

export const settingsSchema = {
  campuses: {
    idPrefix: 'c_',
    fields: {
      name: { default: '', type: 'text', label: '名稱', required: true },
      address: { default: '', type: 'text', label: '地址' },
      phone: { default: '', type: 'text', label: '電話' }
    }
  },

  feeItems: {
    idPrefix: 'f_',
    fields: {
      name: { default: '', type: 'text', label: '名稱', required: true },
      defaultAmount: { default: 0, type: 'number', label: '金額', required: true },
      isEditable: { default: true, type: 'checkbox', label: '可修改'},
      isRequired: { default: false, type: 'checkbox', label: '必填' }
    }
  },

  teachers: {
    idPrefix: 't_',
    fields: {
      name: { default: '', type: 'text', label: '姓名', required: true },
      subject: { default: '', type: 'text', label: '科目' }
    }
  },

  courseCategories: {
    idPrefix: 'cc_',
    fields: {
      name: { default: '', type: 'text', label: '分類名稱', required: true }
    }
  },
  
  staffs: {
    idPrefix: 's_',
    fields: {
      name: { default: '', type: 'text', label: '姓名', required: true },
      role: { default: '', type: 'text', label: '職位' }
    }
  }
}