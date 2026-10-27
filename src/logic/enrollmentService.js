export const makeEnrollmentId = (schema, courseId, studentId) =>
  `${schema.idPrefix ?? 'enrollment_'}${courseId}_${studentId}`

export const filterActive = (list) =>
  (list || []).filter((e) => e.dataStatus !== 'deleted')

export const createEnrollment = (schema, data = {}, now = new Date()) => {
  const obj = {}
  for (const key in schema.fields) {
    obj[key] = data[key] ?? schema.fields[key].default ?? null
  }
  if (data.id) obj.id = data.id

  if (!obj.campusId) {
    throw new Error(`createEnrollment: campusId is required (student: ${obj.studentId})`)
  }

  const iso = now.toISOString()
  obj.createdAt = iso
  obj.updatedAt = iso
  return obj
}

// 算出要寫入的內容（不寫入）。anchorKey 是固定的一方，targetKey 是要同步的一方。
export const planSync = ({
  activeList, anchorKey, anchorId, targetKey, targetIds,
  studentMap, schema, now = new Date()
}) => {
  const current = activeList.filter((e) => e[anchorKey] === anchorId)
  const currentTargets = new Set(current.map((e) => e[targetKey]))
  const targetSet = new Set(targetIds) // 同時去重
  const iso = now.toISOString()

  // ➖ 軟刪除
  const updates = current
    .filter((e) => !targetSet.has(e[targetKey]))
    .map((e) => ({ id: e.id, data: { dataStatus: 'deleted', updatedAt: iso } }))

  // ➕ 新增（全部組好、驗證完才回傳）
  const sets = []
  for (const targetId of targetSet) {
    if (currentTargets.has(targetId)) continue

    const studentId = anchorKey === 'studentId' ? anchorId : targetId
    const courseId = anchorKey === 'courseId' ? anchorId : targetId

    const student = studentMap.get(studentId)
    if (!student?.campusId) {
      throw new Error(`找不到學生或學生缺少 campusId：${studentId}`)
    }

    sets.push(
      createEnrollment(schema, {
        id: makeEnrollmentId(schema, courseId, studentId),
        studentId,
        courseId,
        campusId: student.campusId,
        dataStatus: 'active'
      }, now)
    )
  }

  return { sets, updates }
}