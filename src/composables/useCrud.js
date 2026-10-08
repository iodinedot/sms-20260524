// composables/useCrud.js
import { ref, computed, effectScope } from 'vue'
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
//
// 2026 更新：拿掉 org / campus scope 的區分。
// 資料隔離的邊界只在 organization 這一層（見下方的
// `organizations/${ORGANIZATION_ID}/...` 路徑），同一個
// organization 底下的 campus 彼此不需要隔離，所以每個 type
// 一律訂閱整個 collection，不再依 campusId 做 query 過濾。
// 如果某個頁面需要「只顯示目前校區的資料」，屬於畫面層的
// 篩選需求，請在該頁面自己用 computed 處理。
//
export function useCrud(type) {
  const storeKey = `${ORGANIZATION_ID}:${type}`

  if (crudStore[storeKey]) {
    return crudStore[storeKey]
  }

  const schema = schemas[type]

  if (!schema || !schema.collection) {
    throw new Error(
      `[useCrud] ❌ invalid schema for type: ${type}\n` +
      `missing: ${!schema ? 'schema' : ' collection'}\n` +
      `schema: ${JSON.stringify(schema, null, 2)}`
    )
  }

  // ===================================================
  // ⭐ Detached effect scope
  // ===================================================
  // 這個 instance 有可能是「第一次」在某個元件的 setup() 過程中
  // 被建立（例如某頁面的 composable 裡第一次呼叫 useCrud('students')）。
  // 如果不特別處理，裡面的 watch() 預設會被 Vue 自動綁定到
  // 當下呼叫者所在的元件，該元件 unmount 時 watch 會被自動清除，
  // 但這個 instance 因為 crudStore 快取，之後還會被別的頁面繼續使用，
  // 導致難以重現的 bug。
  // 用 effectScope(true)（detached）建立一個獨立作用域，
  // 確保這裡面的 ref/computed 永遠只跟著這個 module 走，
  // 不受任何呼叫端元件生命週期影響。
  const scope = effectScope(true)

  const instance = scope.run(() => {
    // ===================================================
    // Firestore references
    // ===================================================
    const collectionPath = schema.collection

    const getCollectionRef = () =>
      collection(db, `organizations/${ORGANIZATION_ID}/${collectionPath}`)

    const getDocumentRef = (id) =>
      doc(db, `organizations/${ORGANIZATION_ID}/${collectionPath}`, id)

    // 給 load / subscribe 用：一律訂閱整個 collection，
    // 不再區分 org / campus，也不再需要 currentCampusId。
    const getQueryRef = () => getCollectionRef()

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
      const snapshot = await getDocs(getQueryRef())

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
      const id =
        item.id ||
        `${schema.idPrefix}${uuidv4()}`

      const payload = { ...item, id }

      // 如果這個 type 定義了 campusId 欄位、但表單忘了帶，
      // 用目前選的校區補上。用「schema 有沒有 campusId 欄位」
      // 判斷，取代之前的 scope === 'campus'，這樣不管 schema
      // 怎麼寫都不用再手動宣告 scope。
      if (schema.fields?.campusId && !payload.campusId) {
        payload.campusId = currentCampusId?.value
      }

      await setDoc(getDocumentRef(id), payload)
    }

    // ===================================================
    // Update
    // ===================================================

    const update = async ({ id, item }) => {
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
    // Batch Write/Update
    // ===================================================

    const BATCH_LIMIT = 500

    // 通用：updates 是 [{ id, data }]，sets 是完整文件（需自帶 id）
    const batchWrite = async ({ updates = [], sets = [] }) => {
      const ops = [
        ...updates.map(u => ({ type: 'update', ref: getDocumentRef(u.id), data: u.data })),
        ...sets.map(item => ({ type: 'set', ref: getDocumentRef(item.id), data: item }))
      ]
      if (!ops.length) return

      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db)
        for (const op of ops.slice(i, i + BATCH_LIMIT)) {
          op.type === 'set' ? batch.set(op.ref, op.data) : batch.update(op.ref, op.data)
        }
        await batch.commit()
      }
    }

    // 舊的呼叫端完全不用改，語意也維持「只更新」
    const batchUpdate = (ids, data) =>
      batchWrite({ updates: ids.map(id => ({ id, data })) })

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
        getQueryRef(),
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

    // 冪等版本：已經在訂閱中就不重建 listener。
    // 給像 useManager 這種「可能被多個元件同時用到同一個 type」的地方用，
    // 避免每個 mount 都重新 subscribe 一次、互相打斷彼此的 listener。
    // 因為訂閱不再跟 currentCampusId 綁定，這裡永遠是安全的，
    // 不管 App 啟動時使用者有沒有選過校區都能呼叫。
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

    return {
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
      batchWrite,
      batchUpdate,
      setList,

      createEmpty,
      generateId,

      organizationId: ORGANIZATION_ID
    }
  })

  crudStore[storeKey] = instance

  return instance
}