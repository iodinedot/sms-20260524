import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'
import { filterActive, planSync } from '@/logic/enrollmentService'

export function useEnrollmentService() {
  const { list, batchWrite } = useCrud('enrollments')
  const { list: students } = useCrud('students')

  const studentMap = computed(() => new Map(students.value.map((s) => [s.id, s])))
  const activeList = computed(() => filterActive(list.value))

  const getByCourse = (courseId) => activeList.value.filter((e) => e.courseId === courseId)
  const getByStudent = (studentId) => activeList.value.filter((e) => e.studentId === studentId)

  const sync = async (anchorKey, anchorId, targetKey, targetIds) => {
    const { sets, updates } = planSync({
      activeList: activeList.value,
      anchorKey, anchorId, targetKey, targetIds,
      studentMap: studentMap.value,
      schema: schemas.enrollments
    })
    if (!sets.length && !updates.length) return
    await batchWrite({ sets, updates })
  }

  const syncCourseStudents = (courseId, studentIds) =>
    sync('courseId', courseId, 'studentId', studentIds)
  const syncStudentCourses = (studentId, courseIds) =>
    sync('studentId', studentId, 'courseId', courseIds)

  return { activeList, getByCourse, getByStudent, syncCourseStudents, syncStudentCourses }
}