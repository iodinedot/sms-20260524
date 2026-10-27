// src/logic/crudService.test.js
import { describe, it, expect } from 'vitest'
import { createCrudService } from './crudService'

const makeFakeRepo = () => {
  const calls = []
  return { calls, set: async (...a) => calls.push(['set', ...a]) }
}
const schema = { collection: 'students', idPrefix: 'stu_', fields: { campusId: {} } }

describe('crudService', () => {
  it('add 會補上 campusId', async () => {
    const repo = makeFakeRepo()
    const svc = createCrudService({ repo, schema, getCampusId: () => 'c1' })
    await svc.add({ id: 'x', name: 'A' })
    expect(repo.calls[0][3].campusId).toBe('c1')
  })

  it('remove 是軟刪除', async () => {
    const repo = makeFakeRepo()
    const svc = createCrudService({ repo, schema, now: () => 'T' })
    await svc.remove('x')
    expect(repo.calls[0]).toEqual(['set', 'students', 'x', { dataStatus: 'deleted', updatedAt: 'T' }, { merge: true }])
  })
})