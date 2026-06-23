// composables/useBilling.js
import { useCrud } from '@/composables/useCrud'
import { useSettings } from '@/composables/useSettings'
import { useEnrollmentService } from '@/modules/enrollment/useEnrollmentService'
import { calculateLessonCount } from '@/utils/lessonCalculator'

export function useBilling() {
  const { list, add, update } = useCrud('billings')
  const { list: students } = useCrud('students')
  const { list: courses } = useCrud('courses')
  const { list: feeItemSettings } = useCrud('feeItems')
  const { getName } = useSettings()
  const { getByStudent } = useEnrollmentService()

  const toAmount = (value) => {
    const amount = Number(value)
    return Number.isFinite(amount) ? amount : 0
  }

  const buildRequiredFeeItems = () => {
    return (feeItemSettings.value || [])
      .filter(item => item.isRequired)
      .map(item => {
        const amount = toAmount(item.defaultAmount)

        return {
          feeItemId: item.id,
          name: item.name || '',
          amount,
          subtotal: amount,
          isEditable: item.isEditable !== false,
          isManuallyAdjusted: false
        }
      })
  }

  // ===== 產生單據編號 =====
  const generateReceiptNumber = () => {
    return `BILL-${Date.now()}`
  }

  // ===== 發單 =====
  const issueBilling = async (billing) => {
    console.log('🔥 [Billing] issue', billing)

    if (!billing?.id) {
      console.warn('❌ billing.id 不存在')
      return
    }

    if (billing.status !== 'draft') {
      console.warn('❌ 只有 draft 可以發單')
      return
    }

    const updatedData = {
      status: 'issued',
      receiptNumber: generateReceiptNumber(),
      issuedDate: new Date().toISOString()
    }
    
    await update({id: billing.id, item: updatedData})

    return {
      ...billing,
      ...updatedData
    }
  }

  // ===== 收款（先簡單版）=====
  const collectPayment = async (billing, payload) => {
    if (!billing?.id) return

    if (billing.status !== 'issued') {
      console.warn('❌ 只有 issued 可以收款')
      return
    }

    const { amount, method } = payload

    const currentPaid = billing.paidAmount || 0
    const newPaid = currentPaid + amount

    const isFullyPaid = newPaid >= billing.total

    const updatedData = {
        paidAmount: newPaid,
        status: isFullyPaid ? 'paid' : 'partial',
        payments: [
        ...(billing.payments || []),
        {
            amount,
            method,
            date: new Date().toISOString()
        }
        ]
    }

    await update({id: billing.id, item: updatedData})

    return {
        ...billing,
        ...updatedData
    }
  }

  // ===== 作廢 =====
  const voidBilling = async (billing) => {
    if (!billing?.id) return

    if (billing.status === 'paid') {
        console.warn('❌ 已付款帳單不能作廢')
        return
    }
    
    if (billing.status === 'void') {
        console.warn('❌ 已作廢帳單')
        return
    }

    const updatedData = {
      status: 'void'
    }

    await update({id: billing.id, item: updatedData})

    return {
      ...billing,
      ...updatedData
    }
  }

  const batchCreateDraft = async ({
    selection,
    period,
    options = { onDuplicate: 'skip' }
  }) => {
    const result = {
      created: [],
      skipped: [],
      overridden: [],
      errors: []
    }
    
    try {
      // ===== 1️⃣ resolve students =====
      let studentIds = []
  
      if (selection.type === 'manual') {
        studentIds = selection.studentIds || []
      } else {
        console.warn('⚠️ filter selection 尚未實作')
        return result
      }
  
      // ===== 2️⃣ loop students =====
      for (const studentId of studentIds) {
        try {
            const student = students.value?.find(s => s.id === studentId)
  
          if (!student) {
            result.errors.push({ studentId, reason: 'student not found' })
            continue
          }
  
          // 👉 取得該學生的課程
          const enrollments = getByStudent(studentId) || []
          console.log(enrollments)
          // ===== 3️⃣ 計算 items =====
          const courseItems = enrollments.map(e => {
            const course = courses.value?.find(c => c.id === e.courseId) || {}
            const lessonCount = calculateLessonCount({
              startDate: period.start,
              endDate: period.end,
              excludedDates: course.excludedDates || [],
              weeklyDays: course.weeklyDays || []
            })

            const subtotal = (course.unitPrice || 0) * (lessonCount || 1)
  
            return {
              courseId: course.id,
              name: course.name,
              teacherName: getName('teachers', course.teacherId),
              billingType: course.billingType,
              lessonCount: lessonCount,
              unitPrice: course.unitPrice,
              subtotal,
              isManuallyAdjusted: false
            }
          })
  
          const feeItems = buildRequiredFeeItems()
  
          const total =
            courseItems.reduce((sum, i) => sum + (i.subtotal || 0), 0) +
            feeItems.reduce((sum, i) => sum + (i.subtotal || 0), 0)
  
          // ===== 4️⃣ duplicate 檢查 =====
          const existing = list.value.find(b =>
            b.studentId === studentId &&
            b.period?.start === period.start &&
            b.period?.end === period.end
          )
  
          if (existing) {
            if (options.onDuplicate === 'skip') {
              result.skipped.push(existing.id)
              continue
            }
  
            if (options.onDuplicate === 'override') {
              await update({
                id: existing.id,
                item: {
                  courseItems,
                  feeItems,
                  total,
                  period
                }
              })
              result.overridden.push(existing.id)
              continue
            }
          }
  
          // ===== 5️⃣ 建立 draft =====
          const newBilling = {
            studentId,
            studentName: student.chName || '',
  
            period,
  
            status: 'draft',
  
            courseItems,
            feeItems,
  
            total,
            paidAmount: 0,
            payments: [],
  
            note: ''
          }
  
          console.log('🧾 newBilling', JSON.stringify(newBilling, null, 2))
          const created = await add(newBilling)
          result.created.push(created?.id || null)
  
        } catch (err) {
          result.errors.push({
            studentId,
            error: err.message
          })
        }
      }
  
      return result
    } catch (err) {
      console.error('🔥 batchCreateDraft error', err)
      throw err
    }
  }

  return {
    // data
    list,

    // actions
    issueBilling,
    collectPayment,
    voidBilling,

    batchCreateDraft
  }
}