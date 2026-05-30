/**
 * ============================================================
 * Billing System - billingGenerator
 * ============================================================
 *
 * 職責：
 * - 根據學生產生 Charge Draft
 * - 計算課程費用
 * - 加入 Required FeeItems
 * - 計算總金額
 *
 * 不負責：
 * - Firestore CRUD
 * - Payment
 * - Charge Status
 * - Invoice Number
 *
 * ============================================================
 */

export function generateStudentCharge({
    student,
    enrollments = [],
    courses = [],
    feeItems = [],
    holidays = [],
    billingStartDate,
    billingEndDate
  }) {
    const activeCourseIds = enrollments
        .filter(
        e =>
            e.studentId === student.id &&
            e.status === 'active'
        )
        .map(e => e.courseId)

    const studentCourses = courses.filter(course =>
        activeCourseIds.includes(course.id)
    )

    const courseItems = []

    for (const course of studentCourses) {
        const item = buildCourseItem({
        course,
        holidays,
        billingStartDate,
        billingEndDate
        })

        if (item) {
        courseItems.push(item)
        }
    }

    const feeItemEntries = feeItems
        .filter(item => item.isRequired)
        .map(item => ({
        type: 'feeItem',
        feeItemId: item.id,
        name: item.name,
        amount: Number(item.defaultAmount || 0),
        subtotal: Number(item.defaultAmount || 0)
        }))

    const total =
        [...courseItems, ...feeItemEntries]
        .reduce(
            (sum, item) => sum + Number(item.subtotal || 0),
            0
        )

    return {
        studentId: student.id,
        studentSnapshot: {
        name: student.name
        },

        billingStartDate,
        billingEndDate,

        courses: studentCourses.map(course => ({
        courseId: course.id,
        name: course.name,
        teacherName: course.teacherName || ''
        })),

        courseItems,
        feeItems: feeItemEntries,
        total
    }
}
  
  /**
   * ============================================================
   * Course Item Builder
   * ============================================================
   */
  function createCourseItem({
    course,
    lessonCount = null,
    subtotal = 0,
    billingStartDate,
    billingEndDate
  }) {
    return {
      type: 'course',
      courseId: course.id,
      billingType: course.billingType,
      name: course.name,
      unitPrice:
        course.billingType === 'fixed-weekly'
          ? course.unitPrice
          : course.fixedTotalAmount,
      lessonCount,
      subtotal,
      periodStart: billingStartDate,
      periodEnd: billingEndDate
    }
  }

  function buildFixedAmountItem({
    course,
    holidays,
    billingStartDate,
    billingEndDate
  }) {
    const courseStart = new Date(course.startDate)
    const courseEnd = new Date(course.endDate)
  
    const billingStart = new Date(billingStartDate)
    const billingEnd = new Date(billingEndDate)
  
    const coversCourse =
      billingStart <= courseStart &&
      billingEnd >= courseEnd
  
    if (!coversCourse) {
      return null
    }
  
    return createCourseItem({
      course,
      subtotal: course.fixedTotalAmount,
      billingStartDate,
      billingEndDate
    })
  }

  function buildFixedWeeklyItem({
    course,
    holidays,
    billingStartDate,
    billingEndDate
  }) {
    const lessonCount = countLessons({
      course,
      holidays,
      billingStartDate,
      billingEndDate
    })
  
    if (lessonCount <= 0) {
      return null
    }
  
    return createCourseItem({
      course,
      lessonCount,
      subtotal: lessonCount * course.unitPrice,
      billingStartDate,
      billingEndDate
    })
  }

  function buildCourseItem({
    course,
    holidays,
    billingStartDate,
    billingEndDate
  }) {
    switch (course.billingType) {
  
      case 'fixed-semester':
      case 'fixed-period':
        return buildFixedAmountItem({
          course,
          billingStartDate,
          billingEndDate
        })
  
      case 'fixed-weekly':
        return buildFixedWeeklyItem({
          course,
          holidays,
          billingStartDate,
          billingEndDate
        })
  
      default:
        return null
    }
  }

  function getEffectiveDateRange({
    course,
    billingStartDate,
    billingEndDate
  }) {
    const start = new Date(
      Math.max(
        new Date(course.startDate),
        new Date(billingStartDate)
      )
    )
  
    const end = new Date(
      Math.min(
        new Date(course.endDate),
        new Date(billingEndDate)
      )
    )
  
    return { start, end }
  }

  function countLessons({
    course,
    holidays = [],
    billingStartDate,
    billingEndDate
  }) {
    if (!Array.isArray(course.schedules)) {
      return 0
    }
  
    const lessonDays = course.schedules
      .map(s => Number(s.dayOfWeek))
      .filter(day => !Number.isNaN(day))
  
    if (!lessonDays.length) {
      return 0
    }
  
    const { start, end } = getEffectiveDateRange({
      course,
      billingStartDate,
      billingEndDate
    })
  
    if (start > end) {
      return 0
    }
  
    const holidaySet = new Set(
      holidays.map(h => h.date)
    )
    let count = 0
  
    const current = new Date(start)
  
    while (current <= end) {
      const day = current.getDay()
  
      const dateString =
        current.toISOString().split('T')[0]
  
      const isHoliday =
        holidaySet.has(dateString)
      if (
        lessonDays.includes(day) &&
        !isHoliday
      ) {
        count++
      }
  
      current.setDate(
        current.getDate() + 1
      )
    }
  
    return count
  }
