// baseSchema.js
// system level fields
export const baseFields = {
    status: {
      default: 'active',
      hidden: true   // 🔥 關鍵
    },
    createdAt: {
      hidden: true
    },
    updatedAt: {
      hidden: true
    }
  }