import { ref } from 'vue'

const STORAGE_KEY = 'bukibo:currentCampusId'

// 全域唯一、跨元件共享的目前校區 id。
// 獨立成小檔案是為了避免 useCrud.js ↔ useCampus.js 互相 import 造成循環依賴：
// useCrud 只需要「讀/寫這個值」，不需要知道 campus 清單怎麼來的。
export const currentCampusId = ref(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY)
    : null
)

export function setCampusId(campusId) {
  if (!campusId) return
  currentCampusId.value = campusId
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, campusId)
  }
}