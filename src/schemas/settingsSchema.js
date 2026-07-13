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
    searchable: true,  
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
    // 🎯 這裡就是驅動 BaseManager 篩選介面的核心設定
    filters: {
      year: {
        label: '年份',
        // 動態從當前的資料庫 list 中萃取出所有不重複的年份，並由大到小排序
        getOptions: (list) => {
          if (!list || list.length === 0) return []
          const years = list.map(item => {
            // 假設 item.date 格式為 "2026-01-01" 或時間戳記
            return item.date ? new Date(item.date).getFullYear() : null
          }).filter(Boolean)
          
          const uniqueYears = [...new Set(years)].sort((a, b) => b - a)
          
          return uniqueYears.map(y => ({ label: `${y} 年`, value: String(y) }))
        },
        // 實際的過濾邏輯
        filter: (item, selectedValue) => {
          if (!item.date) return false
          const itemYear = String(new Date(item.date).getFullYear())
          return itemYear === selectedValue
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
    searchable: false,
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
    searchable: false, 
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
    searchable: false, 
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
    searchable: false, 
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