import { computed, watch } from 'vue'
import { useCrud } from './useCrud'
import { currentCampusId, setCampusId } from './campusState'

// campuses 是 org-scoped、registerInSettings: true，
// useCrud('campuses') 是 module-level singleton，
// 這裡拿到的跟 useSettings 內部用的其實是同一個 instance，
// 不會重複建立新的 Firestore listener。
const campusesCrud = useCrud('campuses')

// ensureSubscribed 是冪等的：不管 useSettings 或這裡誰先呼叫，
// 都只會有一個 listener 在跑。
campusesCrud.ensureSubscribed()

// 如果使用者從沒選過校區（第一次登入、或 localStorage 被清空），
// 自動選一個預設值：優先選 isMain，否則選清單第一筆。
// module 層級的 watcher，只會註冊一次。
watch(
  () => campusesCrud.list.value,
  (list) => {
    if (currentCampusId.value) return
    if (!list.length) return

    const main = list.find(c => c.isMain) || list[0]
    setCampusId(main.id)
  },
  { immediate: true }
)

export function useCampus() {
  return {
    currentCampusId,
    campusList: computed(() => campusesCrud.list.value),
    isLoading: campusesCrud.isLoading,
    setCampus: setCampusId
  }
}