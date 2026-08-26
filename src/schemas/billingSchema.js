import { defineCampusSchema } from './schemaFactory'
import { formatDatePeriod } from '@/utils/formatters'
import { BILLING_STATUS_OPTIONS } from '@/constants/options'

export const billingSchema = {
  billings: defineCampusSchema('billings', {
    idPrefix: 'bill_',
    title: '帳單管理',
    emptyText: '目前沒有帳單資料。',
    pagination: true,
    fields: {
      receiptNumber: { default: '', type: 'text', label: '單據編號', showInTable: false, readonly: true },
      studentId: { default: null, type: 'text', label: '學生ID', hidden: true },
      studentName: { default: '', type: 'text', label: '學生姓名', showInTable: true, readonly: true },
      period: {
        default: { start: '', end: '', label: '' },
        type: 'custom', label: '期間', component: 'DatePeriod',
        format: (v) => formatDatePeriod(v, 'range'), readonly: true, showInTable: false
      },
      billingStatus: { default: 'draft', type: 'select', label: '狀態', showInTable: true, options: BILLING_STATUS_OPTIONS },
      courseItems: { default: [], type: 'custom', label: '課程項目', component: 'CourseItemsEditor', showInTable: false },
      feeItems: { default: [], type: 'custom', label: '行政項目', component: 'FeeItemsEditor', showInTable: false },
      total: { default: 0, type: 'number', label: '應收金額', showInTable: true },
      isTotalManuallyAdjusted: { default: false, hidden: true },
      paidAmount: { default: 0, type: 'number', label: '已收金額', showInTable: false },
      payments: { default: [], hidden: true },
      paymentMethod: {
        default: '', type: 'select', label: '付款方式',
        options: [{ label: '現金', value: 'cash' }, { label: '轉帳', value: 'transfer' }],
        showInTable: false
      },
      paidDate: { default: '', type: 'date', label: '付款日期', showInTable: false },
      note: { default: '', type: 'textarea', label: '備註', showInTable: false },
      issuedDate: { default: '', type: 'date', label: '開單日期', readonly: true, showInTable: false },
      createdBy: { default: '', hidden: true },
      updatedBy: { default: '', hidden: true }
    },
    ui: {
      toolbar: { create: false, search: true, import: false, export: false, batchCreate: true, filters: ['billingStatus'] },
      batchActions: ['delete', 'restore', 'issue', 'void']
    }
  })
}

// shape 定義跟 CRUD/schema 系統無關，維持原樣、原檔案匯出
export const courseItemShape = {
  courseId: '',
  name: '',
  teacherName: '',
  billingType: '',
  lessonCount: null,
  unitPrice: 0,
  subtotal: 0,
  isManuallyAdjusted: false
}

export const feeItemShape = {
  feeItemId: '',
  name: '',
  amount: 0,
  subtotal: 0,
  isEditable: true
}