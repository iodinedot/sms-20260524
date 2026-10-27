// baseSchema.js
// system level fields
export const baseFields = {
    dataStatus: {
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