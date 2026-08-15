// composables/useCrud.js
import { ref, computed } from 'vue'
import { schemas } from '@/schemas'
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

  if (!schema) {
    console.error(`[useCrud] Unknown type: ${type}`)
    return null
  }

  // ===================================================
  // Firestore references
  // ===================================================

  const getCollectionRef = () =>
    collection(
      db,
      'organizations',
      ORGANIZATION_ID,
      type
    )

  const getDocumentRef = (id) =>
    doc(
      db,
      'organizations',
      ORGANIZATION_ID,
      type,
      id
    )

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