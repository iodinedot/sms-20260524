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
    },

    issue: {
      key: 'issue',
      label: '發單',
      type: 'primary',
  
      enabled: (ctx) =>
        ctx.selectedItems.length > 0 &&
        ctx.selectedItems.every(i => i.billingStatus === 'draft'),
  
      handler: async (ctx, helpers) => {
        console.log('🔥 batch issue', ctx.selectedItems)
  
        await helpers.batchIssue(ctx.selectedItems)
      }
    },
  
    void: {
      key: 'void',
      label: '作廢',
      type: 'danger',
  
      enabled: (ctx) =>
        ctx.selectedItems.length > 0 &&
        ctx.selectedItems.every(i => i.billingStatus === 'issued'),
  
      handler: async (ctx, helpers) => {
        console.log('🔥 batch void', ctx.selectedItems)
  
        await helpers.batchVoid(ctx.selectedItems)
      }
    }
  }