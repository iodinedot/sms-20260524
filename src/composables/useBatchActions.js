import { useCrud } from '@/composables/useCrud'

export function useBatchActions(type) {
  const { batchUpdate } = useCrud(type)

  const batchDelete = async (items) => {
    const ids = items.map(i => i.id)

    await batchUpdate(ids, {
      status: 'deleted'
    })
  }

  const batchRestore = async (items) => {
    const ids = items.map(i => i.id)
    
    await batchUpdate(ids, {
      status: 'active'
    })
  }
  return {
    batchDelete,
    batchRestore
  }
}
    