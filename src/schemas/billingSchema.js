import { baseFields } from './baseSchemas'
import { formatDatePeriod } from '@/utils/formatters'

export const billingSchema = {
  billings: {
    idPrefix: 'bill_',
    searchable: true,
    pagination: true,

    fields: {
      // ===== 基本資訊 =====
      receiptNumber: {
        default: '',
        type: 'text',
        label: '單據編號',
        showInTable: true,
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
        showInTable: true
      },

      // ===== 帳單狀態（核心）=====
      status: {
        default: 'draft',
        type: 'select',
        label: '狀態',
        showInTable: true,
        options: [
          { label: '草稿', value: 'draft' },
          { label: '已開單', value: 'issued' },
          { label: '部分付款', value: 'partial' },
          { label: '已付款', value: 'paid' },
          { label: '作廢', value: 'void' }
        ]
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
        showInTable: true
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
        ]
      },

      paidDate: {
        default: '',
        type: 'date',
        label: '付款日期'
      },

      // ===== 備註 =====
      note: {
        default: '',
        type: 'textarea',
        label: '備註'
      },

      // ===== 時間 =====
      issuedDate: {
        default: '',
        type: 'date',
        label: '開單日期',
        readonly: true
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