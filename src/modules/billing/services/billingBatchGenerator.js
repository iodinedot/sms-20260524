/**
 * ============================================================
 * Billing System - billingBatchGenerator
 * ============================================================
 *
 * 職責：
 * - 批次產生 Charge Draft
 * - 一位學生產生一張 Draft
 *
 * 不負責：
 * - Firestore
 * - Invoice Number
 * - Payment
 * - Charge Status
 *
 * ============================================================
 */

import { generateStudentCharge } from './billingGenerator'

export function generateCharges({
  studentIds = [],

  students = [],
  enrollments = [],
  courses = [],
  feeItems = [],
  holidays = [],

  billingStartDate,
  billingEndDate
}) {
  return studentIds
    .map(studentId => {
      const student = students.find(
        s => s.id === studentId
      )

      if (!student) {
        return null
      }

      return generateStudentCharge({
        student,

        enrollments,
        courses,
        feeItems,
        holidays,

        billingStartDate,
        billingEndDate
      })
    })
    .filter(Boolean)
}