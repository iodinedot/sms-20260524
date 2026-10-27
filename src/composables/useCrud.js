// composables/useCrud.js
// UI 層：只負責 ref / computed、訂閱生命週期、singleton 快取。
import { ref, computed } from 'vue'
import { schemas } from '@/schemas'
import { currentCampusId } from '@/composables/campusState'
import { createCrudService } from '@/logic/crudService'
import { repository } from '@/data'
import { ORGANIZATION_ID } from '@/config/organization'

const crudStore = {}

// 資料隔離邊界只在 organization 層；同一 organization 下每個 type
// 一律訂閱整個 collection。需要「只看目前校區」請在頁面用 computed 篩選。
export function useCrud(type) {
  const storeKey = `${ORGANIZATION_ID}:${type}`
  if (crudStore[storeKey]) return crudStore[storeKey]

  const schema = schemas[type]
  if (!schema || !schema.collection) {
    throw new Error(
      `[useCrud] ❌ invalid schema for type: ${type}\n` +
      `missing: ${!schema ? 'schema' : 'collection'}\n` +
      `schema: ${JSON.stringify(schema, null, 2)}`
    )
  }

  const service = createCrudService({
    repo: repository,
    schema,
    getCampusId: () => currentCampusId?.value
  })

  const rawList = ref([])
  const isLoading = ref(true)
  let unsubscribe = null

  const load = async () => {
    rawList.value = await service.load()
  }

  const subscribe = () => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true

    unsubscribe = service.subscribe(
      (items) => {
        rawList.value = items
        isLoading.value = false
      },
      (error) => {
        console.error(`[useCrud] subscribe error: ${type}`, error)
        isLoading.value = false
      }
    )
  }

  const stop = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // 冪等：已在訂閱就不重建 listener
  const ensureSubscribed = () => {
    if (!unsubscribe) subscribe()
  }

  const activeList = computed(() => service.filterActive(rawList.value))

  const instance = {
    rawList,
    list: activeList,
    isLoading,

    subscribe,
    stop,
    ensureSubscribed,
    load,

    add: service.add,
    update: service.update,
    remove: service.remove,
    batchWrite: service.batchWrite,
    batchUpdate: service.batchUpdate,
    setList: service.setList,

    createEmpty: service.createEmpty,
    generateId: service.generateId,

    organizationId: ORGANIZATION_ID
  }

  crudStore[storeKey] = instance
  return instance
}