/**
 * ============================================================
 * Billing System - useBillingData
 * ============================================================
 *
 * 職責：
 * - 整合 Firebase 資料
 * - 提供 Billing 使用
 *
 * ============================================================
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCrud } from '@/composables/useCrud'

export function useBillingData() {

  // ===== CRUD =====
  const studentsCrud = useCrud('students')
  const coursesCrud = useCrud('courses')
  const enrollmentsCrud = useCrud('enrollments')
  const feeItemsCrud = useCrud('feeItems')
  const holidaysCrud = useCrud('holidays')

  // ===== local state =====
  const loading = ref(true)

  // ===== subscribe =====
  const subscribeAll = () => {
    studentsCrud.subscribe()
    coursesCrud.subscribe()
    enrollmentsCrud.subscribe()
    feeItemsCrud.subscribe()
    holidaysCrud.subscribe()
  }

  const stopAll = () => {
    studentsCrud.stop?.()
    coursesCrud.stop?.()
    enrollmentsCrud.stop?.()
    feeItemsCrud.stop?.()
    holidaysCrud.stop?.()
  }

  onMounted(() => {
    subscribeAll()
  })

  onUnmounted(() => {
    stopAll()
  })

  // ===== raw list =====
  const students = computed(() => studentsCrud.list.value || [])
  const courses = computed(() => coursesCrud.list.value || [])
  const enrollments = computed(() => enrollmentsCrud.list.value || [])
  const feeItems = computed(() => feeItemsCrud.list.value || [])
  const holidays = computed(() => holidaysCrud.list.value || [])

  // ===== loading / ready =====
  const ready = computed(() => {
    return (
      studentsCrud.list.value &&
      coursesCrud.list.value &&
      enrollmentsCrud.list.value &&
      feeItemsCrud.list.value &&
      holidaysCrud.list.value
    )
  })

  // ===== maps =====
  const studentsMap = computed(() => {
    const map = {}
    for (const s of students.value) {
      map[s.id] = s
    }
    return map
  })

  const coursesMap = computed(() => {
    const map = {}
    for (const c of courses.value) {
      map[c.id] = c
    }
    return map
  })

  // ===== helpers =====

  const getStudent = (id) => {
    return studentsMap.value[id] || null
  }

  const getCourse = (id) => {
    return coursesMap.value[id] || null
  }

  const getStudentEnrollments = (studentId) => {
    return enrollments.value.filter(
      e => e.studentId === studentId && e.status === 'active'
    )
  }

  const getStudentCourses = (studentId) => {
    const courseIds = getStudentEnrollments(studentId).map(e => e.courseId)

    return courseIds
      .map(id => getCourse(id))
      .filter(Boolean)
  }

  return {
    // state
    loading,
    ready,

    // raw
    students,
    courses,
    enrollments,
    feeItems,
    holidays,

    // maps
    studentsMap,
    coursesMap,

    // helpers
    getStudent,
    getCourse,
    getStudentEnrollments,
    getStudentCourses
  }
}