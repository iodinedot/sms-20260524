import { generateStudentBilling } from '@/modules/billing/billingGenerator'

// ===== 假資料 =====
const student = {
  id: 'stu001',
  name: '王小明'
}

const courses = [
  {
    id: 'course001',
    name: '英文班',
    billingType: 'weekly-by-lesson',
    unitPrice: 400,
    schedules: [
      { dayOfWeek: 1 }, // 每週一
      { dayOfWeek: 3 }  // 每週三
    ]
  }
]

const enrollments = [
  {
    studentId: 'stu001',
    courseId: 'course001',
    dataStatus: 'active'
  }
]

const feeItems = [
  {
    id: 'fee001',
    name: '註冊費',
    defaultAmount: 1000,
    isRequired: true,
    isEditable: false
  }
]

const holidays = [
  { date: '2026-03-18' } // 假日測試
]

// ===== 執行 =====
const result = generateStudentBilling({
  student,
  courses,
  enrollments,
  feeItems,
  billingStartDate: '2026-03-01',
  billingEndDate: '2026-03-31',
  holidays
})

console.log('🔥 billing result:', result)
