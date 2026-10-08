// composables/useEnrollmentService.js
import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'

export function useEnrollmentService() {
  const { list, batchWrite } = useCrud('enrollments')
  const { list: students } = useCrud('students')

  const studentMap = computed(() => new Map(students.value.map(s => [s.id, s])))

  const activeList = computed(() =>
    list.value.filter(e => e.dataStatus !== 'deleted')
  )

  // 確定性 id：同一學生 + 同一課程永遠是同一份文件，避免重複建立
  const enrollmentId = (courseId, studentId) =>
    `${schemas.enrollments.idPrefix ?? 'enrollment_'}${courseId}_${studentId}`

  const createEnrollment = (data = {}) => {
    const schema = schemas.enrollments.fields
    const obj = {}

    for (const key in schema) {
      obj[key] = data[key] ?? schema[key].default ?? null
    }
    if (data.id) obj.id = data.id

    // 不允許沒有 campusId 的 enrollment
    if (!obj.campusId) {
      throw new Error(`createEnrollment: campusId is required (student: ${obj.studentId})`)
    }

    const now = new Date().toISOString()
    obj.createdAt = now
    obj.updatedAt = now
    return obj
  }

  const getByCourse = (courseId) => activeList.value.filter(e => e.courseId === courseId)
  const getByStudent = (studentId) => activeList.value.filter(e => e.studentId === studentId)

  // 通用同步：anchorKey 是固定的一方，targetKey 是要同步的一方
  const sync = async (anchorKey, anchorId, targetKey, targetIds) => {
    const current = activeList.value.filter(e => e[anchorKey] === anchorId)
    const currentTargets = new Set(current.map(e => e[targetKey]))
    const targetSet = new Set(targetIds) // 同時去重
    const now = new Date().toISOString()

    // ➖ 軟刪除
    const updates = current
      .filter(e => !targetSet.has(e[targetKey]))
      .map(e => ({ id: e.id, data: { dataStatus: 'deleted', updatedAt: now } }))

    // ➕ 新增（先全部組好、驗證完，才會真正寫入）
    const sets = []
    for (const targetId of targetSet) {
      if (currentTargets.has(targetId)) continue

      const studentId = anchorKey === 'studentId' ? anchorId : targetId
      const courseId = anchorKey === 'courseId' ? anchorId : targetId

      const student = studentMap.value.get(studentId)
      if (!student?.campusId) {
        throw new Error(`找不到學生或學生缺少 campusId：${studentId}`)
      }

      sets.push(
        createEnrollment({
          id: enrollmentId(courseId, studentId),
          studentId,
          courseId,
          campusId: student.campusId, // ✅ 明確取自學生
          dataStatus: 'active'
        })
      )
    }

    if (!sets.length && !updates.length) return
    await batchWrite({ sets, updates })
  }

  const syncCourseStudents = (courseId, studentIds) =>
    sync('courseId', courseId, 'studentId', studentIds)

  const syncStudentCourses = (studentId, courseIds) =>
    sync('studentId', studentId, 'courseId', courseIds)

  return { activeList, getByCourse, getByStudent, syncCourseStudents, syncStudentCourses }
}