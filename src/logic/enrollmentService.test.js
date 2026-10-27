import { describe, it, expect } from 'vitest'
import { planSync } from './enrollmentService'

const schema = { idPrefix: 'enr_', fields: { studentId: {}, courseId: {}, campusId: {}, dataStatus: {} } }
const T = new Date('2026-10-21T00:00:00.000Z')
const studentMap = new Map([['s1', { id: 's1', campusId: 'c1' }], ['s2', { id: 's2', campusId: 'c1' }]])

describe('planSync', () => {
  it('新增沒有的、軟刪除多的', () => {
    const activeList = [{ id: 'e1', courseId: 'k1', studentId: 's1' }]
    const { sets, updates } = planSync({
      activeList, anchorKey: 'courseId', anchorId: 'k1',
      targetKey: 'studentId', targetIds: ['s2'], studentMap, schema, now: T
    })
    expect(updates[0]).toEqual({ id: 'e1', data: { dataStatus: 'deleted', updatedAt: T.toISOString() } })
    expect(sets[0].id).toBe('enr_k1_s2')
    expect(sets[0].campusId).toBe('c1')
  })

  it('學生缺 campusId 會丟錯', () => {
    expect(() => planSync({
      activeList: [], anchorKey: 'courseId', anchorId: 'k1',
      targetKey: 'studentId', targetIds: ['ghost'], studentMap, schema, now: T
    })).toThrow('找不到學生')
  })
})