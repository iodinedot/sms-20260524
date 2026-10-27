import { buildCourseItem, calculateBillingTotal } from './billingCalculator'

// 純邏輯：不 import vue、不 import firebase。
// 時間與外部函式都由參數注入，方便測試。

export const buildRequiredFeeItems = (feeItemSettings = []) =>
  (feeItemSettings || [])
    .filter((item) => item.isRequired)
    .map((item) => {
      const amount = Number(item.defaultAmount) || 0
      return {
        feeItemId: item.id,
        name: item.name || '',
        amount,
        subtotal: amount,
        isEditable: item.isEditable !== false,
        isManuallyAdjusted: false
      }
    })

export const generateReceiptNumber = (now = new Date()) => `BILL-${now.getTime()}`

export const resolveBillingStatus = (billings, { studentId, period }) => {
  const existing = (billings || []).find(
    (b) =>
      b.studentId === studentId &&
      b.period?.start === period.start &&
      b.period?.end === period.end
  )
  return existing
    ? { status: 'duplicate', existing }
    : { status: 'new', existing: null }
}

// 組出某學生在某期間的帳單內容（preview 與 batch create 共用）
export const buildDraft = ({
  enrollments = [],
  courseMap = {},
  feeItemSettings = [],
  period,
  calculateLessonCount,
  getName
}) => {
  const courseItems = enrollments.map((e) =>
    buildCourseItem({
      course: courseMap[e.courseId] || {},
      period,
      calculateLessonCount,
      getName
    })
  )
  const feeItems = buildRequiredFeeItems(feeItemSettings)
  const total = calculateBillingTotal({ courseItems, feeItems })
  return { courseItems, feeItems, total }
}

export const buildNewBilling = ({ student, period, draft }) => ({
  studentId: student.id,
  studentName: student.name || '',
  period,
  billingStatus: 'draft',
  courseItems: draft.courseItems,
  feeItems: draft.feeItems,
  total: draft.total,
  paidAmount: 0,
  payments: [],
  note: ''
})

// ===== 狀態轉換：回傳「要更新的欄位」，不符合條件回傳 null =====

export const planIssue = (billing, now = new Date()) => {
  if (!billing?.id) return null
  if (billing.billingStatus !== 'draft') return null
  return {
    billingStatus: 'issued',
    receiptNumber: generateReceiptNumber(now),
    issuedDate: now.toISOString()
  }
}

export const planPayment = (billing, { amount, method }, now = new Date()) => {
  if (!billing?.id) return null
  if (billing.billingStatus !== 'issued') return null

  const newPaid = (billing.paidAmount || 0) + amount
  return {
    paidAmount: newPaid,
    billingStatus: newPaid >= billing.total ? 'paid' : 'partial',
    payments: [
      ...(billing.payments || []),
      { amount, method, date: now.toISOString() }
    ]
  }
}

export const planVoid = (billing) => {
  if (!billing?.id) return null
  if (billing.billingStatus === 'paid') return null
  if (billing.billingStatus === 'void') return null
  return { billingStatus: 'void' }
}