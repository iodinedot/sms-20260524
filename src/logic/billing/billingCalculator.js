// modules/billing/billingCalculator.js

// =========================
// 🔥 單一來源（唯一計算邏輯）
// =========================

export const calculateCourseSubtotal = (item) => {
    if (!item) return 0
  
    if (item.billingType === 'weekly-by-lesson') {
      return (item.unitPrice || 0) * (item.lessonCount || 0)
    }
  
    // 🔥 其他全部固定
    return item.fixedTotalAmount || item.subtotal || 0
}
  
  // =========================
// 🔥 billing total（唯一來源）
// =========================
export const calculateBillingTotal = ({ courseItems, feeItems }) => {
    const courseTotal = (courseItems || []).reduce(
      (sum, i) => sum + (i.subtotal || 0),
      0
    )
  
    const feeTotal = (feeItems || []).reduce(
      (sum, i) => sum + (i.subtotal || 0),
      0
    )
  
    return courseTotal + feeTotal
  }
  
  // =========================
  // 🔥 update（UI 用）
  // =========================
  export const updateCourseItem = (item, lessonCount) => {
    const updated = {
      ...item,
      lessonCount: Number(lessonCount) || 0
    }
  
    updated.subtotal = calculateCourseSubtotal(updated)
  
    updated.isManuallyAdjusted = true
  
    return updated
  }
  
  
  // =========================
  // 🔥 build（初始化用）
  // =========================
  export const buildCourseItem = ({
    course,
    period,
    calculateLessonCount,
    getName
  }) => {
    const lessonCount = calculateLessonCount({
      startDate: period.start,
      endDate: period.end,
      excludedDates: course.excludedDates || [],
      weeklyDays: course.weeklyDays || []
    })
  
    const base = {
      courseId: course.id,
      name: course.name,
      teacherName: getName('teachers', course.teacherId),
      billingType: course.billingType,
      lessonCount,
      unitPrice: course.unitPrice,
      subtotal: course.fixedTotalAmount || 0, // 🔥 先放 base
      isManuallyAdjusted: false
    }
  
    // 🔥 統一計算（關鍵）
    base.subtotal = calculateCourseSubtotal(base)
  
    return base
  }