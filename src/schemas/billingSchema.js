import { baseFields } from './baseSchemas'
import { formatDatePeriod } from '@/utils/formatters'
import { BILLING_STATUS_OPTIONS, BILLING_STATUS_GROUPS } from '@/constants/options'

export const billingSchema = {
  billings: {
    idPrefix: 'bill_',
    title:'帳單管理',
    emptyText:'目前沒有帳單資料。',
    searchable: true,
    pagination: true,

    fields: {
      // ===== 基本資訊 =====
      receiptNumber: {
        default: '',
        type: 'text',
        label: '單據編號',
        showInTable: false,
        readonly: true   // 🔥 不可手動改
      },
      studentId: {
        default: null,
        type: 'text',
        label: '學生ID',
        hidden: true
      },
      studentName: {
        default: '',
        type: 'text',
        label: '學生姓名',
        showInTable: true,
        readonly: true   
      },

      period: {
        default: {
          start: '',
          end: '',
          label: ''
        },
        type: 'custom',
        label: '期間',
        component: 'DatePeriod',
        format: (v) => formatDatePeriod(v, 'range'),
        readonly: true,
        showInTable: false
      },

      // ===== 帳單狀態（核心）=====
      billingStatus: {
        default: 'draft',
        type: 'select',
        label: '狀態',
        showInTable: true,
        options: BILLING_STATUS_OPTIONS
      },

      // ===== 收費內容 =====
      courseItems: {
        default: [],
        type: 'custom', // 🔥 用你的 custom renderer
        label: '課程項目',
        component: 'CourseItemsEditor',
        showInTable: false
      },

      feeItems: {
        default: [],
        type: 'custom',
        label: '行政項目',
        component: 'FeeItemsEditor',
        showInTable: false
      },

      // ===== 金額 =====
      total: {
        default: 0,
        type: 'number',
        label: '應收金額',
        showInTable: true
      },

      isTotalManuallyAdjusted: {
        default: false,
        hidden: true
      },
      
      paidAmount: {
        default: 0,
        type: 'number',
        label: '已收金額',
        showInTable: false
      },

      payments: {
        default: [],
        hidden: true
      },

      paymentMethod: {
        default: '',
        type: 'select',
        label: '付款方式',
        options: [
          { label: '現金', value: 'cash' },
          { label: '轉帳', value: 'transfer' }
        ],
        showInTable: false
      },

      paidDate: {
        default: '',
        type: 'date',
        label: '付款日期',
        showInTable: false
      },

      // ===== 備註 =====
      note: {
        default: '',
        type: 'textarea',
        label: '備註',
        showInTable: false
      },

      // ===== 時間 =====
      issuedDate: {
        default: '',
        type: 'date',
        label: '開單日期',
        readonly: true,
        showInTable: false
      },

      // ===== baseFields 合併 =====
      ...baseFields,

      // 👉 建議你加這兩個（你剛剛提到）
      createdBy: {
        default: '',
        hidden: true
      },
      updatedBy: {
        default: '',
        hidden: true
      }
    },
    
    filters: {
      billingStatus: {
        label: '帳單狀態',
    
        getOptions: () => BILLING_STATUS_OPTIONS,
    
        filter: (item, value) => {
          if (!value || value.length === 0) return true
        
          return value.includes(item.billingStatus)
        }
      }
    },
    ui: {
      toolbar: {
        create: false,
        search: true,
        import: false,
        export: false,
    
        // Billing 特有
        batchCreate: true,
    
        filters: [
          'billingStatus'
        ]
      },
    
      batchActions: [
        'delete',
        'restore',
        'issue',
        'void'
      ]
    }
  }
}


export const courseItemShape = {
  courseId: '',

  // 🔥 snapshot
  name: '',
  teacherName: '',

  billingType: '', // 'weekly-total' | 'weekly-by-lesson' | 'period-total'

  // 🔥 only for weekly-by-lesson
  lessonCount: null,

  unitPrice: 0,

  subtotal: 0,

  isManuallyAdjusted: false
}

export const feeItemShape = {
  feeItemId: '',

  // 🔥 snapshot
  name: '',

  amount: 0,

  subtotal: 0,

  isEditable: true
}