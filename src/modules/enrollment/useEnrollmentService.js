// composables/useEnrollmentService.js
import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'

export function useEnrollmentService() {
  const { list, add, batchUpdate } = useCrud('enrollments')

  // 🔥 active enrollments（統一過濾）
  const activeList = computed(() =>
    list.value.filter(e => e.status !== 'deleted')
  )

  // 🔥 建立資料（吃 schema）
  const createEnrollment = (data = {}) => {
    const schema = schemas.enrollments.fields
    const obj = {}

    for (const key in schema) {
      obj[key] = data[key] ?? schema[key].default ?? null
    }

    const now = new Date().toISOString()
    obj.createdAt = now
    obj.updatedAt = now

    return obj
  }

  // 🔥 取得某課程的學生（不用打 DB）
  const getByCourse = (courseId) => {
    return activeList.value.filter(e => e.courseId === courseId)
  }

  // 🔥 取得某學生的課程
  const getByStudent = (studentId) => {
    return activeList.value.filter(e => e.studentId === studentId)
  }

  // 🔥 核心：同步「課程 → 學生」
  const syncCourseStudents = async (courseId, studentIds) => {
    const current = activeList.value.filter(
      e => e.courseId === courseId
    )


    console.log('courseId:', courseId)
    console.log('studentIds:', studentIds)

    const currentMap = new Map(current.map(e => [e.studentId, e]))
    const newSet = new Set(studentIds)

    // ➖ 軟刪除
    const idsToDelete = current
      .filter(e => !newSet.has(e.studentId))
      .map(e => e.id)

    await batchUpdate(idsToDelete, {
      status: 'deleted',
      updatedAt: new Date().toISOString()
    })

    // ➕ 新增（或未來可支援復原）
    for (const studentId of studentIds) {
      const exist = currentMap.get(studentId)

      if (!exist) {
        await add(
          createEnrollment({
            studentId,
            courseId,
            status: 'active'
          })
        )
      }
    }
  }

  // 🔥（可選）同步「學生 → 課程」
  const syncStudentCourses = async (studentId, courseIds) => {
    const current = activeList.value.filter(
      e => e.studentId === studentId
    )

    const currentMap = new Map(current.map(e => [e.courseId, e]))
    const newSet = new Set(courseIds)

    // ➖ 軟刪除
    const idsToDelete = current
      .filter(e => !newSet.has(e.courseId))
      .map(e => e.id)

    await batchUpdate(idsToDelete, {
      status: 'deleted',
      updatedAt: new Date().toISOString()
    })

    // ➕ 新增
    for (const courseId of courseIds) {
      const exist = currentMap.get(courseId)

      if (!exist) {
        await add(
          createEnrollment({
            studentId,
            courseId,
            status: 'active'
          })
        )
      }
    }
  }

  return {
    activeList,
    getByCourse,
    getByStudent,
    syncCourseStudents,
    syncStudentCourses
  }
}