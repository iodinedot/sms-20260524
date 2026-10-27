import {
    collection, doc, getDocs, setDoc, updateDoc, onSnapshot, writeBatch
  } from 'firebase/firestore'
  
  const BATCH_LIMIT = 500
  
  /**
   * Repository 介面（logic 層依賴的是這份形狀，不是 Firestore）：
   *   getAll(path)                         → Promise<Item[]>
   *   subscribe(path, onData, onError)     → unsubscribe()
   *   set(path, id, data, options?)        → Promise<void>
   *   update(path, id, data)               → Promise<void>
   *   mergeMany(path, items)               → Promise<void>   (每筆 merge 寫入，需自帶 id)
   *   batchWrite(path, { updates, sets })  → Promise<void>
   *
   * path 是相對於 organization 的 collection 名稱，例如 'students'。
   * 回傳的 Item 一律是 { id, ...data } 的純物件。
   */
  export function createFirestoreRepository({ db, organizationId }) {
    const base = (path) => `organizations/${organizationId}/${path}`
    const colRef = (path) => collection(db, base(path))
    const docRef = (path, id) => doc(db, base(path), id)
  
    // Firestore 特有的 snapshot 在這裡轉成純物件，不外漏
    const toItems = (snapshot) =>
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  
    return {
      async getAll(path) {
        return toItems(await getDocs(colRef(path)))
      },
  
      subscribe(path, onData, onError) {
        return onSnapshot(
          colRef(path),
          (snapshot) => onData(toItems(snapshot)),
          onError
        )
      },
  
      async set(path, id, data, options) {
        await setDoc(docRef(path, id), data, options)
      },
  
      async update(path, id, data) {
        await updateDoc(docRef(path, id), data)
      },
  
      async mergeMany(path, items) {
        await Promise.all(
          items.map((item) => setDoc(docRef(path, item.id), item, { merge: true }))
        )
      },
  
      async batchWrite(path, { updates = [], sets = [] }) {
        const ops = [
          ...updates.map((u) => ({ type: 'update', ref: docRef(path, u.id), data: u.data })),
          ...sets.map((item) => ({ type: 'set', ref: docRef(path, item.id), data: item }))
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
    }
  }