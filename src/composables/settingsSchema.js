// composables/settingsSchema.js
import { importHolidays } from '../services/holidayService'

export const settingsSchema = {
  semesters: {
    idPrefix: 'sme_',
    fields: {
      name: { default: '', type: 'text', label: '學期名稱', required: true },
      startDate: { default: '', type: 'date', label: '開始日期', required: true },
      endDate: { default: '', type: 'date', label: '結束日期', required: true }
    }
  },

  holidays: {
    idPrefix: 'h_',
    // 1️⃣ 啟用或關閉功能（不寫預設也是 true，因為 BaseManager 用 !== false 判斷）
    searchable: true,  
    pagination: true,
    fields: {
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
    }
  },

  campuses: {
    idPrefix: 'camp_',
    searchable: false, 
    fields: {
      name: { default: '', type: 'text', label: '名稱', required: true },
      address: { default: '', type: 'text', label: '地址' },
      phone: { default: '', type: 'text', label: '電話' }
    }
  },

  feeItems: {
    idPrefix: 'f_',
    searchable: false, 
    fields: {
      name: { default: '', type: 'text', label: '名稱', required: true },
      defaultAmount: { default: 0, type: 'number', label: '金額', required: true },
      isEditable: { default: true, type: 'checkbox', label: '可修改'},
      isRequired: { default: false, type: 'checkbox', label: '必填' }
    }
  },

  teachers: {
    idPrefix: 't_',
    searchable: false, 
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
    idPrefix: 'st_',
    searchable: false, 
    fields: {
      name: { default: '', type: 'text', label: '姓名', required: true },
      role: { default: '', type: 'text', label: '職位' }
    }
  }
}