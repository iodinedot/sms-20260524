//registry (純定義)
//↓
//useBatchActions（執行 + CRUD）
//↓
//useToolbar（UI mapping）
//   ↓
//Component
import { computed, ref } from 'vue'
import { batchActionRegistry } from '@/utils/registry'

/**
 * Toolbar Runtime Engine
 */
export function useToolbar({
  schema,
  selectedIds,
  selectedItems
}) {
  // =========================
  // 🧠 STATE
  // =========================
  const mode = computed(() =>
    selectedIds.value.length > 0 ? 'batch' : 'normal'
  )

  const selectedCount = computed(() => selectedIds.value.length)

  // =========================
  // ⚙️ CONFIG (schema → UI)
  // =========================
  const config = computed(() => {
    return schema?.ui?.toolbar || {
      showSearch: true,
      showCreate: true,
      showBatchCreate: false,
      filters: []
    }
  })

  // =========================
  // 🔥 NORMAL MODE ACTIONS
  // =========================
  const toolbarActions = computed(() => {
    if (mode.value !== 'normal') return []

    return {
      showSearch: config.value.showSearch,
      showCreate: config.value.showCreate,
      showBatchCreate: config.value.showBatchCreate,
      filters: config.value.filters || []
    }
  })

  // =========================
  // 🔥 BATCH MODE ACTIONS
  // =========================
  const batchActions = computed(() => {
    if (mode.value !== 'batch') return []

    const keys = schema?.ui?.batchActions || []

    return keys
      .map(key => {
        const action = batchActionRegistry[key]
        if (!action) return null

        return {
          key,
          label: action.label,
          type: action.type || 'primary',
          enabled: action.enabled
            ? action.enabled({ selectedIds, selectedItems })
            : true,
          handler: () => runAction(key)
        }
      })
      .filter(Boolean)
  })

  return {
    // state
    mode,
    selectedCount,

    // ui config
    config,
    toolbarActions,
    batchActions
  }
}