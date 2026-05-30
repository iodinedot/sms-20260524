/**
 * ============================================================
 * Billing System - useBillingDrafts
 * ============================================================
 *
 * 職責：
 * - 管理 Draft Charges
 * - 提供 BillingCreateModal 使用
 *
 * ============================================================
 */

import { ref } from 'vue'

import {
  generateCharges
} from '../services/billingBatchGenerator'

export function useBillingDrafts() {

  const drafts = ref([])

  const generate = (payload) => {
    drafts.value = generateCharges(payload)
  }

  const clear = () => {
    drafts.value = []
  }

  const removeDraft = (studentId) => {
    drafts.value = drafts.value.filter(
      draft => draft.studentId !== studentId
    )
  }

  const updateDraft = (studentId, updater) => {
    const index = drafts.value.findIndex(
      draft => draft.studentId === studentId
    )

    if (index === -1) return

    updater(drafts.value[index])
  }

  return {
    drafts,

    generate,
    clear,

    removeDraft,
    updateDraft
  }
}