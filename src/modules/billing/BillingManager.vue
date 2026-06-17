<script setup>
import { ref, watch } from 'vue'

import SearchBar from '@/components/base/SearchBar.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import TableRenderer from '@/components/shared/TableRenderer.vue'
import Toolbar from '@/components/base/Toolbar.vue'
import BillingDetailModal from '@/modules/billing/BillingDetailModal.vue'

import { useManager } from '@/composables/useManager'
import { useTableSelection } from '@/composables/useTableSelection'
import { useBatchActions } from '@/composables/useBatchActions'
import { useBilling } from '@/modules/billing/useBilling'
import { schemas } from '@/schemas'

const {
  list: billings,
  dataFiltered: filteredBillings,
  isLoading
} = useManager({
  type: 'billings',
  schema: schemas.billings,
  useSearch: true
})

const {
  issueBilling,
  collectPayment,
  voidBilling,

  batchCreateDraft
} = useBilling()

const searchQuery = ref('')

const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(filteredBillings)

const { batchDelete } = useBatchActions('billings', {
  selectedIds
})

watch(searchQuery, () => {
  if (selectedIds.value.length > 0) {
    clearSelection()
  }
})

const handleIssue = async (item) => {
  await issueBilling(item)
}

const handleVoid = async (item) => {
  await voidBilling(item)
}

const handleCollect = async (item) => {
  const amount = Number(prompt('輸入收款金額'))
  if (!amount) return

  const method = prompt('付款方式 (cash / transfer / card)') || 'cash'

  await collectPayment(item, { amount, method })
}

const isViewModalOpen = ref(false)
const currentBilling = ref(null)

const handleView = (item) => {
  currentBilling.value = item
  isViewModalOpen.value = true
}

const testBatch = async () => {
  const res = await batchCreateDraft({
    selection: {
      type: 'manual',
      studentIds: ['s_1779062231147'] // 🔥 換掉
    },
    period: {
      start: '2026-06-01',
      end: '2026-06-30',
      label: '2026-06'
    },
    options: {
      onDuplicate: 'skip'
    }
  })

  console.log('🔥 batch result', res)
}
</script>

<template>
  <div class="billing-manager">

    <!-- loading -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p style="margin-left: 10px; font-weight: bold;">
        帳單資料同步中...
      </p>
    </div>

    <!-- title -->
    <h2 class="page-title">帳單管理</h2>

    <BaseButton text="測試產生帳單" @click="testBatch" />

    <!-- toolbar -->
    <Toolbar
      :selectedCount="selectedIds.length"
      @batch-delete="batchDelete"
    >
      <template #search>
        <SearchBar v-model="searchQuery" />
      </template>
    </Toolbar>

    <!-- table -->
    <TableRenderer
      :items="filteredBillings"
      :fields="schemas.billings.fields"
      selectable
      :selectedIds="selectedIds"
      :isAllSelected="isAllSelected"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
      @row-click="handleView"
    >
      <template #cell-receiptNumber="{ item }">
        <span v-if="item.status === 'draft'" class="text-muted">
          （草稿）
        </span>
        <span v-else>
          {{ item.receiptNumber }}
        </span>
      </template>
      <template #actions="{ item }">

        <BaseButton
          text="查看"
          variant="outline"
          icon="👁"
          @click.stop="handleView(item)"
        />

        <!-- 發單 -->
        <BaseButton
          text="發單"
          variant="outline"
          @click.stop="handleIssue(item)"
          :disabled="item.status !== 'draft'"
        />

        <!-- 收款 -->
        <BaseButton
          text="收款"
          variant="outline"
          @click.stop="handleCollect(item)"
          :disabled="!['issued', 'partial'].includes(item.status)"
        />

        <!-- 作廢 -->
        <BaseButton
          text="作廢"
          variant="outline"
          @click.stop="handleVoid(item)"
          :disabled="item.status === 'paid' || item.status === 'void'"
        />

      </template>
    </TableRenderer>

    <!-- empty state -->
    <div
      v-if="!billings || billings.length === 0"
      style="padding: 40px; text-align: center; color: #999"
    >
      目前暫無帳單資料
    </div>
    <BillingDetailModal
      v-model:isOpen="isViewModalOpen"
      :billing="currentBilling"
    />
  </div>
</template>