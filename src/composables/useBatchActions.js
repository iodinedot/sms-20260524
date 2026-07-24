// src/composables/useBatchActions.js

import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useBilling } from '@/modules/billing/composables/useBilling'
import { batchActionRegistry } from '@/utils/registry'

export function useBatchActions(type, { selectedIds, selectedItems }) {
  const { batchUpdate } = useCrud(type)
  const { batchIssue, batchVoid } = useBilling()

  // =========================
  // 🧠 Context
  // =========================
  const context = computed(() => ({
    type,
    selectedIds: selectedIds.value,
    selectedItems: selectedItems?.value || []
  }))

  // =========================
  // 🔥 Actions（從 registry 來）
  // =========================
  const actions = computed(() => {
    return Object.values(batchActionRegistry)
  })

  // =========================
  // 🔥 Enabled actions
  // =========================
  const getEnabledActions = computed(() => {
    return actions.value.filter(action =>
      action.enabled ? action.enabled(context.value) : true
    )
  })

  // =========================
  // 🔥 Runner（整合 registry）
  // =========================
  const runAction = async (key) => {
    const action = actions.value.find(a => a.key === key)
    if (!action) return
  
    if (action.enabled && !action.enabled(context.value)) return
  
    await action.handler(context.value, {
      batchUpdate,
      batchIssue,
      batchVoid
    })
  }

  return {
    actions,
    getEnabledActions,
    runAction,
    context
  }
}