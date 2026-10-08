import { useCrud } from '@/composables/useCrud'

// 常用、會被跨頁面/跨模組引用的 collection 列在這裡。
//
// 2026 更新：useCrud 的訂閱不再依賴 currentCampusId
// （scope 區分已移除），所以這裡可以直接在 App 啟動時
// 呼叫 ensureSubscribed，不需要 watch 校區是否已選定。
const GLOBAL_COLLECTIONS = ['students', 'teachers', 'courses']

export function initGlobalSubscriptions() {
  GLOBAL_COLLECTIONS.forEach((type) => {
    useCrud(type).ensureSubscribed()
  })
}