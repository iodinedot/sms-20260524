// composables/useCrud.js
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
import { db } from "@/firebase/config";
import { v4 as uuidv4 } from 'uuid'

const crudStore = {} // 🔥 全域

export function useCrud(type) {
  if (crudStore[type]) {
    return crudStore[type] // 🔥 直接回傳舊的
  }

  const schema = schemas[type]

  if (!schema) {
    console.error(`[useCrud] Unknown type: ${type}`)
  }

  // 🔥 載入資料（🔥缺的核心）
  const load = async () => {
    const snapshot = await getDocs(collection(db, type))
    rawList.value = snapshot.docs.map(doc => doc.data())
  }

  // 🔥 建立空物件
  const createEmpty = () => {
    const obj = {}

    Object.entries(schema.fields).forEach(([key, field]) => {
      obj[key] = field.default
    })

    return obj
  }

  // 🔥 id
  const generateId = () => `${schema.idPrefix}${uuidv4()}`

  // 🔥 新增
  const add = async (item) => {
    console.log('🔥 [CrudLog] add called\n', type, item)
    const id = `${schemas[type].idPrefix}${uuidv4()}`
    await setDoc(doc(db, type, id), item)
  }

  // 🔥 更新
  const update = async ({ id, item }) => {
    console.log('🔥 [CrudLog] update called', id, item)
    if (!id || !item) return
  
    await updateDoc(doc(db, type, id), item)
  }

  // 🔥 刪除
  const remove = async (id) => {
    console.log('🔥 [CrudLog] remove called\n', type, id)
    if (!id) return
    await setDoc(doc(db, type, id), {
      dataStatus: 'deleted',
      updatedAt: new Date().toISOString()
    }, { merge: true })
  }

  const batchUpdate = async (ids, data) => {
    const batch = writeBatch(db)
  
    ids.forEach(id => {
      const ref = doc(db, type, id)
      batch.update(ref, data)
    })
  
    await batch.commit()
  }

  // 🔥 覆蓋（排序）
  const setList = async (newList) => {
    const promises = newList.map((item, index) =>
      setDoc(
        doc(db, type, item.id),
        { ...item, order: index },
        { merge: true }
      )
    )
  
    await Promise.all(promises)
  }

  // 🔽 建立一次
  const rawList = ref([])
  const isLoading = ref(true)
  let unsubscribe = null

  const subscribe = () => {
    if (unsubscribe) unsubscribe()

    isLoading.value = true

    unsubscribe = onSnapshot(collection(db, type), (snapshot) => {
      rawList.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      isLoading.value = false
    })
  }

  const stop = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const activeList = computed(() =>
    rawList.value.filter(item => item.dataStatus !== 'deleted')
  )

  const instance = {
    rawList,
    list: activeList,
    isLoading,
    subscribe,   // 🔥 要有
    stop,        // 🔥 要有
    add,
    update,
    remove,
    batchUpdate,
    setList,
    createEmpty
  }

  crudStore[type] = instance // 🔥 存起來

  return instance
}
