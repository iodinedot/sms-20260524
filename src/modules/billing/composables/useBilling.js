// composables/useBilling.js
// UI 層：取得響應式資料來源，把規則委派給 logic。
import { useCrud } from '@/composables/useCrud'
import { useSettings } from '@/composables/useSettings'
import { useCourses } from '@/modules/course/useCourses'
import { useEnrollmentService } from '@/modules/enrollment/useEnrollmentService'
import { calculateLessonCount } from '@/utils/lessonCalculator'
import * as B from '@/logic/billing/billingService'

export function useBilling() {
  const { list, add, update, batchUpdate } = useCrud('billings')
  const { list: students } = useCrud('students')
  const { list: feeItemSettings } = useCrud('feeItems')

  const { getName } = useSettings()
  const { courseMap } = useCourses()
  const { getByStudent } = useEnrollmentService()

  const resolveBillingStatus = ({ studentId, period }) =>
    B.resolveBillingStatus(list.value, { studentId, period })

  const makeDraft = (studentId, period) =>
    B.buildDraft({
      enrollments: getByStudent(studentId) || [],
      courseMap: courseMap.value,
      feeItemSettings: feeItemSettings.value,
      period,
      calculateLessonCount,
      getName
    })

  // 共用：算出更新內容 → 寫入 → 回傳合併後的 billing
  const applyPlan = async (billing, updatedData) => {
    if (!updatedData) return
    await update({ id: billing.id, item: updatedData })
    return { ...billing, ...updatedData }
  }

  const issueBilling = (billing) => applyPlan(billing, B.planIssue(billing))
  const collectPayment = (billing, payload) =>
    applyPlan(billing, B.planPayment(billing, payload))
  const voidBilling = (billing) => applyPlan(billing, B.planVoid(billing))

  const batchCreateDraft = async ({
    selection,
    period,
    options = { onDuplicate: 'skip' }
  }) => {
    const result = { created: [], skipped: [], overridden: [], errors: [] }

    if (selection.type !== 'manual') {
      console.warn('⚠️ filter selection 尚未實作')
      return result
    }

    for (const studentId of selection.studentIds || []) {
      try {
        const student = students.value?.find((s) => s.id === studentId)
        if (!student) {
          result.errors.push({ studentId, reason: 'student not found' })
          continue
        }

        const draft = makeDraft(studentId, period)
        const { status, existing } = resolveBillingStatus({ studentId, period })

        if (status === 'duplicate') {
          if (options.onDuplicate === 'skip') {
            result.skipped.push(existing.id)
            continue
          }
          if (options.onDuplicate === 'override') {
            await update({
              id: existing.id,
              item: { ...draft, period }
            })
            result.overridden.push(existing.id)
            continue
          }
        }

        const created = await add(B.buildNewBilling({ student, period, draft }))
        result.created.push(created?.id || null)
      } catch (err) {
        result.errors.push({ studentId, error: err.message })
      }
    }

    return result
  }

  const buildDraftPreview = ({ studentIds, period }) => {
    const result = []
    for (const studentId of studentIds) {
      const student = students.value?.find((s) => s.id === studentId)
      if (!student) continue

      const draft = makeDraft(studentId, period)
      const { status, existing } = resolveBillingStatus({ studentId, period })

      result.push({
        studentId,
        studentName: student.name,
        ...draft,
        status,
        existingBillingId: existing?.id || null
      })
    }
    return result
  }

  const getStudentCourseCount = (studentId) => getByStudent(studentId).length

  const batchIssue = (items) =>
    batchUpdate(items.map((i) => i.id), { billingStatus: 'issued' })

  const batchVoid = (items) =>
    batchUpdate(items.map((i) => i.id), { billingStatus: 'void' })

  return {
    list,
    resolveBillingStatus,
    issueBilling,
    collectPayment,
    voidBilling,
    batchCreateDraft,
    buildDraftPreview,
    getStudentCourseCount,
    batchIssue,
    batchVoid
  }
}