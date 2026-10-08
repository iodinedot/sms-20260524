// src/composables/useBatchActions.js

import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useBilling } from '@/modules/billing/composables/useBilling'
import { batchActionRegistry } from '@/utils/registry'
import { schemas } from '@/schemas'

export function useBatchActions(type, { selectedIds, selectedItems }) {
  const { batchUpdate } = useCrud(type)
  const { batchIssue, batchVoid } = useBilling()

  const context = computed(() => ({
    type,
    selectedIds: selectedIds.value,
    selectedItems: selectedItems?.value || []
  }))

  const actions = computed(() => Object.values(batchActionRegistry))

  const getEnabledActions = computed(() =>
    actions.value.filter(action =>
      action.enabled ? action.enabled(context.value) : true
    )
  )

  // 給 schema 的 guard 用：查詢其他 collection 的最新資料（會強制 reload，避免用到未訂閱的空資料）
  const queryCollection = async (otherType, predicate) => {
    const other = useCrud(otherType)
    await other.load()
    return other.list.value.filter(predicate)
  }

  const runAction = async (key) => {
    const action = actions.value.find(a => a.key === key)
    if (!action) return
    if (action.enabled && !action.enabled(context.value)) return

    const schema = schemas[type]
    const guard = schema?.guards?.[key]
    if (guard) {
      const blockMessage = await guard(context.value, { queryCollection })
      if (blockMessage) {
        console.error(blockMessage) // 依你們實際的錯誤提示方式調整，例如 toast
        return
      }
    }

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