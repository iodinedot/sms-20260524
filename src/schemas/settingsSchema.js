// composables/settingsSchema.js
import { baseFields } from './baseSchemas'
import { importHolidays } from '@/modules/admin/holidayService'
import { formatDatePeriod } from '@/utils/formatters'

export const settingsSchema = {
  semesters: {
    idPrefix: 'sme_',
    fields: {
      ...baseFields,
      name: { default: '', type: 'text', label: '學期名稱', required: true },
      period: {
        default: { start: '', end: '' },
        type: 'custom',
        label: '期間',
        component: 'DatePeriod',
        format: (v) => formatDatePeriod(v, 'range'),
        showInTable: true,
        span: 2 
      }
    },
    ui: {
      toolbar: {
        create: true,
        search: true,
        import: false,   // ⭐ 這個就是關鍵
        export: false,
        filters: []
      },
    
      batchActions: [
        'delete',
        'restore'
      ]
    }
  },

  holidays: {
    idPrefix: 'h_',
    // 1️⃣ 啟用或關閉功能（不寫預設也是 true，因為 BaseManager 用 !== false 判斷）
    pagination: true,
    fields: {
      ...baseFields,
      type: { default: 'national', type: 'select', label: '假日類型', required: true,
        options: [
          { label: '國定假日', value: 'national' },
          { label: '補假', value: 'makeup' },
          { label: '自訂停課', value: 'custom' },
          { label: '其他', value: 'other' }
        ]
      },
      name: { default: '', type: 'text', label: '假日名稱', required: true },
      date: { default: '', type: 'date', label: '假日日期', required: true }
    },
    importConfig: {
      enabled: true,
      handler: importHolidays,
      params: {
        year: {
          type: 'number',
          label: '年份',
          default: new Date().getFullYear()
        }
      }
    },
    ui: {
      toolbar: {
        create: true,
        search: true,
        import: true,   // ⭐ 這個就是關鍵
        export: false,
        filters: []
      },
    
      batchActions: [
        'delete',
        'restore'
      ]
    }
  },

  campuses: {
    idPrefix: 'camp_',
    labelKey: 'name',
    fields: {
      ...baseFields,
      name: { default: '', type: 'text', label: '名稱', required: true },
      address: { default: '', type: 'text', label: '地址' },
      phone: { default: '', type: 'text', label: '電話' }
    },
    ui: {
      toolbar: {
        create: true,
        search: true,
        import: true,   // ⭐ 這個就是關鍵
        export: false,
        filters: []
      },
    
      batchActions: [
        'delete',
        'restore'
      ]
    }
  },

  feeItems: {
    idPrefix: 'f_',
    fields: {
      ...baseFields,
      name: { default: '', type: 'text', label: '名稱', required: true },
      defaultAmount: { default: 0, type: 'number', label: '金額', required: true },
      isEditable: { default: true, type: 'checkbox', label: '可修改'},
      isRequired: { default: false, type: 'checkbox', label: '必填' }
    },
    ui: {
      toolbar: {
        create: true,
        search: true,
        import: false,   // ⭐ 這個就是關鍵
        export: false,
        filters: []
      },
    
      batchActions: [
        'delete',
        'restore'
      ]
    }
  },

  teachers: {
    idPrefix: 't_',
    fields: {
      ...baseFields,
      name: { default: '', type: 'text', label: '姓名', required: true },
      subject: { default: '', type: 'text', label: '科目' }
    },
    ui: {
      toolbar: {
        create: true,
        search: true,
        import: false,   // ⭐ 這個就是關鍵
        export: false,
        filters: []
      },
    
      batchActions: [
        'delete',
        'restore'
      ]
    }
  },

  staffs: {
    idPrefix: 'st_',
    fields: {
      ...baseFields,
      name: { default: '', type: 'text', label: '姓名', required: true },
      role: { default: '', type: 'text', label: '職位' }
    },
    ui: {
      toolbar: {
        create: true,
        search: true,
        import: false,   // ⭐ 這個就是關鍵
        export: false,
        filters: []
      },
    
      batchActions: [
        'delete',
        'restore'
      ]
    }
  }
}