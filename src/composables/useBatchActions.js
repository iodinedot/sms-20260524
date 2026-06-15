import { useCrud } from '@/composables/useCrud'

export function useBatchActions(type, { selectedIds }) {
  const { batchUpdate } = useCrud(type)

  const batchDelete = async () => {
    const ids = selectedIds.value

    if (!ids.length) return
    await batchUpdate(ids, {
      status: 'deleted'
    })
  }

  const batchRestore = async () => {
    const ids = selectedIds.value

    if (!ids.length) return
    await batchUpdate(ids, {
      status: 'active'
    })
  }
  return {
    batchDelete,
    batchRestore
  }
}