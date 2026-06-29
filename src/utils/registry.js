// src/utils/registry.js

export const batchActionRegistry = {
    delete: {
      key: 'delete',
      label: '刪除',
      type: 'danger',
  
      enabled: (ctx) => ctx.selectedIds.length > 0,
  
      handler: async (ctx, helpers) => {
        await helpers.batchUpdate(ctx.selectedIds, {
          dataStatus: 'deleted'
        })
      }
    },
  
    restore: {
      key: 'restore',
      label: '還原',
      type: 'secondary',
  
      enabled: (ctx) => ctx.selectedIds.length > 0,
  
      handler: async (ctx, helpers) => {
        await helpers.batchUpdate(ctx.selectedIds, {
          dataStatus: 'active'
        })
      }
    }
  }