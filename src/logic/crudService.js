import { v4 as uuidv4 } from 'uuid'

/**
 * 純邏輯：不 import vue、不 import firebase。
 * 所有外部依賴（repo、目前校區、時間）都從參數注入，所以可以直接單元測試。
 */
export function createCrudService({
  repo,
  schema,
  getCampusId = () => null,
  now = () => new Date().toISOString()
}) {
  const path = schema.collection

  const generateId = () => `${schema.idPrefix}${uuidv4()}`

  const createEmpty = () => {
    const obj = {}
    Object.entries(schema.fields).forEach(([key, field]) => {
      obj[key] = field.default
    })
    return obj
  }

  // 軟刪除的規則屬於業務邏輯，所以放這裡，不放 repository
  const filterActive = (items) =>
    items.filter((item) => item.dataStatus !== 'deleted')

  const load = () => repo.getAll(path)

  const subscribe = (onData, onError) => repo.subscribe(path, onData, onError)

  const add = async (item) => {
    const id = item.id || generateId()
    const payload = { ...item, id }

    // schema 有 campusId 欄位、但表單沒帶 → 用目前校區補上
    if (schema.fields?.campusId && !payload.campusId) {
      payload.campusId = getCampusId()
    }

    await repo.set(path, id, payload)
    return payload
  }

  const update = async ({ id, item }) => {
    if (!id || !item) return
    await repo.update(path, id, item)
  }

  const remove = async (id) => {
    if (!id) return
    await repo.set(path, id, { dataStatus: 'deleted', updatedAt: now() }, { merge: true })
  }

  // updates: [{ id, data }]、sets: 完整文件（需自帶 id）
  const batchWrite = (ops) => repo.batchWrite(path, ops)

  const batchUpdate = (ids, data) =>
    batchWrite({ updates: ids.map((id) => ({ id, data })) })

  const setList = (newList) =>
    repo.mergeMany(path, newList.map((item, index) => ({ ...item, order: index })))

  return {
    generateId, createEmpty, filterActive,
    load, subscribe,
    add, update, remove, batchWrite, batchUpdate, setList
  }
}