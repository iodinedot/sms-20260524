// composables/useCrud.js
import { ref, computed, watch } from 'vue'
import { schemas } from '@/schemas'
import { currentCampusId } from '@/composables/campusState'

import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { v4 as uuidv4 } from 'uuid'

// =====================================================
// Organization
// =====================================================

// 暫時固定目前的 Organization
// 之後完成 Google Login + Membership 後再改成動態取得
const ORGANIZATION_ID = 'HAfhVOsXK9p1J9MZJiFg'

// =====================================================
// CRUD Store
// =====================================================

const crudStore = {}

// =====================================================
// useCrud
// =====================================================

export function useCrud(type) {
  const storeKey = `${ORGANIZATION_ID}:${type}`

  if (crudStore[storeKey]) {
    return crudStore[storeKey]
  }

  const schema = schemas[type]
  //console.log(`[useCrud] type: ${type}`)
  
  if (!schema || !schema.collection || !schema.scope) {
    throw new Error(
      `[useCrud] ❌ invalid schema for type: ${type}\n` +
      `missing: ${!schema ? 'schema' : ''}` +
      `${schema && !schema.collection ? ' collection' : ''}` +
      `${schema && !schema.scope ? ' scope' : ''}\n` +
      `schema: ${JSON.stringify(schema, null, 2)}`
    )
  }

  // ===================================================
  // Firestore references
  // ===================================================
  const collectionPath = schema.collection

  // 單一路徑解析來源。scope 一律從 schema 拿，不接受呼叫端覆寫。
  const resolveCollectionPath = () => {
    const orgId = ORGANIZATION_ID

    if (schema.scope === 'org') {
      return `organizations/${orgId}/${collectionPath}`
    }

    if (schema.scope === 'campus') {
      const campusId = currentCampusId?.value
      if (!campusId) {
        throw new Error(
          `[useCrud:${type}] campus-scoped collection "${collectionPath}" but campusId is missing`
        )
      }
      return `organizations/${orgId}/campuses/${campusId}/${collectionPath}`
    }

    throw new Error(
      `[useCrud:${type}] invalid scope "${schema.scope}" for collection "${collectionPath}" — must be 'org' or 'campus'`
    )
  }

  const getCollectionRef = () => collection(db, resolveCollectionPath())
  const getDocumentRef = (id) => doc(db, resolveCollectionPath(), id)

  // ===================================================
  // State
  // ===================================================

  const rawList = ref([])
  const isLoading = ref(true)

  let unsubscribe = null

  // ===================================================
  // Load
  // ===================================================

  const load = async () => {
    const snapshot = await getDocs(getCollectionRef())

    rawList.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  // ===================================================
  // Create empty
  // ===================================================

  const createEmpty = () => {
    const obj = {}

    Object.entries(schema.fields).forEach(([key, field]) => {
      obj[key] = field.default
    })

    return obj
  }

  // ===================================================
  // ID
  // ===================================================

  const generateId = () =>
    `${schema.idPrefix}${uuidv4()}`

  // ===================================================
  // Add
  // ===================================================

  const add = async (item) => {
    console.log(
      '🔥 [CrudLog] add called',
      type,
      item
    )

    const id =
      item.id ||
      `${schema.idPrefix}${uuidv4()}`

    await setDoc(
      getDocumentRef(id),
      {
        ...item,
        id
      }
    )
  }

  // ===================================================
  // Update
  // ===================================================

  const update = async ({ id, item }) => {
    console.log(
      '🔥 [CrudLog] update called',
      id,
      item
    )

    if (!id || !item) return

    await updateDoc(
      getDocumentRef(id),
      item
    )
  }

  // ===================================================
  // Remove
  // ===================================================

  const remove = async (id) => {
    console.log(
      '🔥 [CrudLog] remove called',
      type,
      id
    )

    if (!id) return

    await setDoc(
      getDocumentRef(id),
      {
        dataStatus: 'deleted',
        updatedAt: new Date().toISOString()
      },
      {
        merge: true
      }
    )
  }

  // ===================================================
  // Batch Update
  // ===================================================

  const batchUpdate = async (ids, data) => {
    const batch = writeBatch(db)

    ids.forEach(id => {
      const ref = getDocumentRef(id)

      batch.update(ref, data)
    })

    await batch.commit()
  }

  // ===================================================
  // Set List / Reorder
  // ===================================================

  const setList = async (newList) => {
    const promises = newList.map((item, index) =>
      setDoc(
        getDocumentRef(item.id),
        {
          ...item,
          order: index
        },
        {
          merge: true
        }
      )
    )

    await Promise.all(promises)
  }

  // ===================================================
  // Subscribe
  // ===================================================

  const subscribe = () => {
    if (unsubscribe) {
      unsubscribe()
    }

    isLoading.value = true

    unsubscribe = onSnapshot(
      getCollectionRef(),
      snapshot => {
        rawList.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        isLoading.value = false
      },
      error => {
        console.error(
          `[useCrud] subscribe error: ${type}`,
          error
        )

        isLoading.value = false
      }
    )
  }

  // ===================================================
  // Stop
  // ===================================================

  const stop = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // ===================================================
  // Campus 切換 → 已訂閱中的 type 自動重新訂閱
  // ===================================================
  // 只有 campus-scoped type 需要對 currentCampusId 變化有反應；
  // org-scoped type（settings 系列）路徑跟 campusId 無關，
  // 完全不設 watcher，避免無意義的觸發。
  if (schema.scope === 'campus') {
    watch(currentCampusId, (newId, oldId) => {
      if (newId === oldId) return

      // 還沒被任何頁面訂閱過的話，什麼都不用做——
      // 之後真正 ensureSubscribed() 時，本來就會用當下最新的 campusId
      if (!unsubscribe) return

      console.log(`[useCrud:${type}] campus changed ${oldId} → ${newId}, resubscribing`)

      // 先清空，避免新資料回來前畫面短暫殘留舊校區的資料
      rawList.value = []
      subscribe()
    })
  }


  // 冪等版本：已經在訂閱中就不重建 listener。
  // 給像 useManager 這種「可能被多個元件同時用到同一個 type」的地方用，
  // 避免每個 mount 都重新 subscribe 一次、互相打斷彼此的 listener。
  const ensureSubscribed = () => {
    if (!unsubscribe) {
      subscribe()
    }
  }
 

  // ===================================================
  // Active List
  // ===================================================

  const activeList = computed(() =>
    rawList.value.filter(
      item => item.dataStatus !== 'deleted'
    )
  )

  // ===================================================
  // Instance
  // ===================================================

  const instance = {
    rawList,
    list: activeList,
    isLoading,

    subscribe,
    stop,
    ensureSubscribed,

    load,

    add,
    update,
    remove,
    batchUpdate,
    setList,

    createEmpty,
    generateId,

    organizationId: ORGANIZATION_ID
  }

  crudStore[storeKey] = instance

  return instance
}