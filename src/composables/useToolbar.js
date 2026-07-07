//registry (純定義)
//↓
//useBatchActions（執行 + CRUD）
//↓
//useToolbar（UI mapping）
//   ↓
//Component
import { computed, ref } from 'vue'
import { useBatchActions } from '@/composables/useBatchActions'

const DEFAULT_TOOLBAR = {
  create: true,
  search: true,
  import: false,
  export: false,
  filters: true,
  batchCreate: false
}
/**
 * Toolbar Runtime Engine
 */
export function useToolbar({
  schema,
  type,
  selectedIds,
  items
}) {
  // 🔥 統一在這裡算
  const selectedItems = computed(() =>
    items.value.filter(item =>
      selectedIds.value.includes(item.id)
    )
  )

  const { actions, runAction } = useBatchActions(type, {
    selectedIds,
    selectedItems
  })

  const mode = computed(() =>
    selectedIds.value.length > 0 ? 'batch' : 'normal'
  )

  const selectedCount = computed(() => selectedIds.value.length)

  // =========================
  // ⚙️ Toolbar Config
  // =========================
  const toolbar = computed(() => ({
    ...DEFAULT_TOOLBAR,
    ...(schema?.ui?.toolbar ?? {})
  }))

  // =========================
  // 🔥 BATCH MODE ACTIONS
  // =========================
  const batchActions = computed(() => {
    if (mode.value !== 'batch') return []
  
    const keys = schema?.ui?.batchActions || []
  
    return keys.map(key => {
      const action = actions.value.find(a => a.key === key)
      if (!action) return null
  
      const context = {
        type,
        selectedIds: selectedIds.value,
        selectedItems: selectedItems.value
      }
  
      return {
        key,
        label: action.label,
        type: action.type,
        disabled: action.enabled
          ? !action.enabled(context)
          : false,
        handler: () => runAction(key)
      }
    }).filter(Boolean)
  })

  return {
    mode,
    selectedCount,
  
    toolbar,
    batchActions
  }
}