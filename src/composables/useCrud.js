// composables/useCrud.js
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { schemas } from '@/schemas'
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from "../firebase/config";
import { v4 as uuidv4 } from 'uuid'

export function useCrud(type) {
  const schema = schemas[type]

  if (!schema) {
    console.error(`[useCrud] Unknown type: ${type}`)
  }

  // 🔥 載入資料（🔥缺的核心）
  const load = async () => {
    const snapshot = await getDocs(collection(db, type))
    list.value = snapshot.docs.map(doc => doc.data())
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
    const id = generateId()
    await setDoc(doc(db, type, id), {
      ...item
    })
    
    return { id, ...item }
  }

  // 🔥 更新
  const update = async (item) => {
    console.log('🔥 update called', type, item)

    if (!item?.id) return

    await setDoc(doc(db, type, item.id), item, { merge: true })
  }

  // 🔥 刪除
  const remove = async (id) => {
    if (!id) return

    await deleteDoc(doc(db, type, id))
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
  const list = ref([])
  let unsubscribe = null

  const subscribe = () => {
    if (unsubscribe) unsubscribe()
    
    unsubscribe = onSnapshot(collection(db, type), (snapshot) => {
      list.value = snapshot.docs.map(doc => {
        const raw = doc.data()
        return {
          id: doc.id,
          ...raw
        }
      })

    })
  }
  
  const stop = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    list,
    subscribe,   // 🔥 要有
    stop,        // 🔥 要有
    add,
    update,
    remove,
    batchUpdate,
    setList,
    createEmpty
  }
}