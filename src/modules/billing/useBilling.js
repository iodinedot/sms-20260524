// composables/useBilling.js
import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useSettings } from '@/composables/useSettings'
import { useCourses } from '@/modules/course/useCourses'
import { useEnrollmentService } from '@/modules/enrollment/useEnrollmentService'
import { calculateLessonCount } from '@/utils/lessonCalculator'

import {
  buildCourseItem,
  calculateBillingTotal
} from '@/modules/billing/billingCalculator'

export function useBilling() {
  const { list, add, update, batchUpdate} = useCrud('billings')
  const { list: students } = useCrud('students')
  const { list: feeItemSettings } = useCrud('feeItems')

  const { getName } = useSettings()
  const { courseMap } = useCourses()
  const { getByStudent } = useEnrollmentService()

  // =========================
  // 🔥 fee items（純資料組裝）
  // =========================
  const buildRequiredFeeItems = () => {
    return (feeItemSettings.value || [])
      .filter(item => item.isRequired)
      .map(item => {
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
  }

  // =========================
  // 🔥 receipt
  // =========================
  const generateReceiptNumber = () => {
    return `BILL-${Date.now()}`
  }

  const resolveBillingStatus = ({ studentId, period }) => {
    const existing = list.value.find(b =>
      b.studentId === studentId &&
      b.period?.start === period.start &&
      b.period?.end === period.end
    )
  
    if (existing) {
      return {
        status: 'duplicate',
        existing
      }
    }
  
    return {
      status: 'new',
      existing: null
    }
  }

  // =========================
  // 🔥 issue
  // =========================
  const issueBilling = async (billing) => {
    if (!billing?.id) return
    if (billing.billingStatus !== 'draft') return

    const updatedData = {
      billingStatus: 'issued',
      receiptNumber: generateReceiptNumber(),
      issuedDate: new Date().toISOString()
    }

    await update({ id: billing.id, item: updatedData })

    return { ...billing, ...updatedData }
  }

  // =========================
  // 🔥 collect payment
  // =========================
  const collectPayment = async (billing, payload) => {
    if (!billing?.id) return
    if (billing.billingStatus !== 'issued') return

    const { amount, method } = payload

    const currentPaid = billing.paidAmount || 0
    const newPaid = currentPaid + amount
    const isFullyPaid = newPaid >= billing.total

    const updatedData = {
      paidAmount: newPaid,
      billingStatus: isFullyPaid ? 'paid' : 'partial',
      payments: [
        ...(billing.payments || []),
        {
          amount,
          method,
          date: new Date().toISOString()
        }
      ]
    }

    await update({ id: billing.id, item: updatedData })

    return { ...billing, ...updatedData }
  }

  // =========================
  // 🔥 void
  // =========================
  const voidBilling = async (billing) => {
    if (!billing?.id) return
    if (billing.billingStatus === 'paid') return
    if (billing.billingStatus === 'void') return

    const updatedData = { billingStatus: 'void' }

    await update({ id: billing.id, item: updatedData })

    return { ...billing, ...updatedData }
  }

  // =========================
  // 🔥 batch create draft（核心）
  // =========================
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

    let studentIds = []

    if (selection.type === 'manual') {
      studentIds = selection.studentIds || []
    } else {
      console.warn('⚠️ filter selection 尚未實作')
      return result
    }

    for (const studentId of studentIds) {
      try {
        const student = students.value?.find(s => s.id === studentId)

        if (!student) {
          result.errors.push({ studentId, reason: 'student not found' })
          continue
        }

        const enrollments = getByStudent(studentId) || []

        // 🔥 單一來源（不再自己算）
        const courseItems = enrollments.map(e => {
          const course = courseMap.value[e.courseId] || {}

          return buildCourseItem({
            course,
            period,
            calculateLessonCount,
            getName
          })
        })

        const feeItems = buildRequiredFeeItems()

        const total = calculateBillingTotal({ courseItems, feeItems })

        const { status, existing } = resolveBillingStatus({ studentId, period })

        if (status === 'duplicate') {
          if (options.onDuplicate === 'skip') {
            result.skipped.push(existing.id)
            continue
          }

          if (options.onDuplicate === 'override') {
            await update({
              id: existing.id,
              item: { courseItems, feeItems, total, period }
            })
            result.overridden.push(existing.id)
            continue
          }
        }

        const newBilling = {
          studentId,
          studentName: student.chName || '',
          period,
          billingStatus: 'draft',
          courseItems,
          feeItems,
          total,
          paidAmount: 0,
          payments: [],
          note: ''
        }

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
  }

  const buildDraftPreview = ({
    studentIds,
    period
  }) => {
    const result = []
  
    for (const studentId of studentIds) {
      const student = students.value?.find(s => s.id === studentId)
      if (!student) continue
  
      const enrollments = getByStudent(studentId) || []
  
      const courseItems = enrollments.map(e => {
        const course = courseMap.value[e.courseId] || {}
  
        return buildCourseItem({
          course,
          period,
          calculateLessonCount,
          getName
        })
      })
  
      const feeItems = buildRequiredFeeItems()
  
      const total = calculateBillingTotal({ courseItems, feeItems })
  
      const { status, existing } = resolveBillingStatus({ studentId, period })

      result.push({
        studentId,
        studentName: student.chName,
        courseItems,
        feeItems,
        total,
        status,
        existingBillingId: existing?.id || null
      })
    }
  
    return result
  }

  const batchIssue = async (items) => {
    const ids = items.map(i => i.id)
  
    await batchUpdate(ids, {
      billingStatus: 'issued'
    })
  }
  
  const batchVoid = async (items) => {
    const ids = items.map(i => i.id)
  
    await batchUpdate(ids, {
      billingStatus: 'void'
    })
  }

  return {
    list,

    resolveBillingStatus,

    issueBilling,
    collectPayment,
    voidBilling,

    batchCreateDraft,
    buildDraftPreview,
    batchIssue,
    batchVoid
  }
}