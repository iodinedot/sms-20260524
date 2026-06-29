// src/composables/useBatchActions.js

import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'

export function useBatchActions(type, { selectedIds, selectedItems }) {
  const { batchUpdate } = useCrud(type)

  // ⭐ 新增：context（未來會擴展）
  const context = computed(() => ({
    type,
    selectedIds: selectedIds.value,
    selectedItems: selectedItems?.value || []
  }))

  // =========================
  // ⭐ Action: Delete
  // =========================
  const deleteAction = {
    key: 'delete',
    label: '刪除',
    type: 'danger',

    // ⭐ 最小版本：只檢查有沒有選
    enabled: (ctx) => ctx.selectedIds.length > 0,

    handler: async (ctx) => {
      if (!ctx.selectedIds.length) return

      await batchUpdate(ctx.selectedIds, {
        dataStatus: 'deleted'
      })
    }
  }

  // =========================
  // ⭐ Action: Restore
  // =========================
  const restoreAction = {
    key: 'restore',
    label: '還原',
    type: 'secondary',

    enabled: (ctx) => ctx.selectedIds.length > 0,

    handler: async (ctx) => {
      if (!ctx.selectedIds.length) return

      await batchUpdate(ctx.selectedIds, {
        dataStatus: 'active'
      })
    }
  }

  // =========================
  // ⭐ Registry（最小）
  // =========================
  const actions = computed(() => {
    return [deleteAction, restoreAction]
  })

  // =========================
  // ⭐ helper（給 UI 用）
  // =========================
  const getEnabledActions = computed(() => {
    return actions.value.filter(action =>
      action.enabled(context.value)
    )
  })

  return {
    actions,             // 全部 actions（未來用）
    getEnabledActions,   // 目前可用 actions
    context              // 給 handler 用
  }
}