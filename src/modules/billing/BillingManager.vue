<script setup>
import { ref, watch, computed } from 'vue'

import SearchBar from '@/components/base/SearchBar.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import TableRenderer from '@/components/shared/TableRenderer.vue'
import Toolbar from '@/components/base/Toolbar.vue'
import BatchActionBar from '@/components/base/BatchActionBar.vue'
import BillingDetailModal from '@/modules/billing/BillingDetailModal.vue'
import BillingEditModal from '@/modules/billing/BillingEditModal.vue'

import { useManager } from '@/composables/useManager'
import { useTableSelection } from '@/composables/useTableSelection'
import { useToolbar } from '@/composables/useToolbar'
import { useBilling } from '@/modules/billing/composables/useBilling'
import { schemas } from '@/schemas'
import { getBillingStatusMeta } from '@/constants/options'
import { useRouter } from 'vue-router'

const keyword = ref('')

const {
  list: billings,
  dataFiltered,
  activeFilters,   // ⭐ 從這裡拿
  errorFields,
  form,
  isOpen: isEditModalOpen,
  isEditing,
  isLoading,
  openEdit,
  handleSave
} = useManager({
  type: 'billings',
  schema: schemas.billings,
  keyword: keyword 
})

const {
  issueBilling,
  collectPayment,
  voidBilling
} = useBilling()

const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(dataFiltered)

const {
  mode,
  selectedCount,
  toolbar,
  batchActions
} = useToolbar({
  schema: schemas.billings,
  type: 'billings',
  selectedIds,
  items: dataFiltered
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

const getOutstanding = (item) => {
  return (item.total || 0) - (item.paidAmount || 0)
}

activeFilters.value.billingStatus = []

const billingStatusTabs = computed(() => {
  const f = schemas.billings.filters?.billingStatus
  if (!f?.getOptions) return []

  return f.getOptions().map(opt => ({
    label: opt.label,
    value: opt.value
  }))
})

// Batch create draft
const router = useRouter()

const openBatchCreate = () => {
  console.log('click batch create')
  router.push('/billing/batch-create')
}

const toggleStatus = (val) => {
  const list = activeFilters.value.billingStatus

  if (list.includes(val)) {
    activeFilters.value.billingStatus =
      list.filter(v => v !== val)
  } else {
    activeFilters.value.billingStatus =
      [...list, val]
  }
}

const clearStatusFilter = () => {
  activeFilters.value.billingStatus = []
}

const hasActiveStatus = computed(() =>
  activeFilters.value.billingStatus.length > 0
)

const updateFilter = ({ key, value }) => {
  activeFilters.value = {
    ...activeFilters.value,
    [key]: value
  }
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

    <!-- toolbar -->
    <Toolbar
      :mode="mode"
      :selectedCount="selectedCount"
      :toolbar="toolbar"
      :batchActions="batchActions"
      @clear="clearSelection"
      @update:filter="updateFilter"
    >

      <!-- 🟢 normal mode slots -->
      <template #search>
        <SearchBar v-model="keyword" />
      </template>

      <template #actions>
        <BaseButton
          text="批次建立帳單"
          icon="🧾"
          variant="primary"
          @click="openBatchCreate"
        />
      </template>

      <template #filters>
        <div class="filter-tabs">
          <BaseButton
            v-for="tab in billingStatusTabs"
            :key="tab.value"
            :text="tab.label"
            :variant="activeFilters.billingStatus.includes(tab.value) ? 'primary' : 'outline'"
            @click="toggleStatus(tab.value)"
          />
          <BaseButton
            v-if="hasActiveStatus"
            text="清除篩選"
            variant="text"
            @click="clearStatusFilter"
          />
        </div>
      </template>

    </Toolbar>

    <!-- table -->
    <TableRenderer
      :items="dataFiltered"
      :fields="schemas.billings.fields"
      selectable
      :selectedIds="selectedIds"
      :isAllSelected="isAllSelected"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
      @row-click="handleView"
      @edit="openEdit($event)"
    >
      <template #cell-receiptNumber="{ item }">
        <span v-if="item.billingStatus === 'draft'" class="text-muted">
          （草稿）
        </span>
        <span v-else>
          {{ item.receiptNumber }}
        </span>
      </template>

      <template #cell-studentName="{ item }">
        <div class="billing-main">
          <div class="billing-name">
            {{ item.studentName }}
          </div>
          <div class="billing-sub">
            {{ item.period?.label }}
          </div>
        </div>
      </template>

      <!-- ⭐ 覆蓋 total 欄 -->
      <template #cell-total="{ item }">
        <div class="billing-amount"
            :class="{
              'billing-outstanding': getOutstanding(item) > 0,
              'billing-paid': getOutstanding(item) === 0
            }">
          {{ getOutstanding(item) }}
        </div>
      </template>

      <template #cell-status="{ value }">
        <span
          class="status-badge"
          :class="`status-${getBillingStatusMeta(value).color}`"
        >
          {{ getBillingStatusMeta(value).label }}
        </span>
      </template>
      <template #actions="{ item }">
        <!-- ⭐ draft -->
        <template v-if="item.billingStatus === 'draft'">
          <BaseButton
            text="發單"
            class="action-primary"
            @click.stop="handleIssue(item)"
          />
        </template>

        <!-- ⭐ issued / partial -->
        <template v-else-if="['issued', 'partial'].includes(item.billingStatus)">
          <BaseButton
            text="收款"
            class="action-primary"
            @click.stop="handleCollect(item)"
          />
          <BaseButton
            text="查看"
            variant="outline"
            @click.stop="handleView(item)"
          />
          <BaseButton
            text="作廢"
            variant="outline"
            @click.stop="handleVoid(item)"
          />
        </template>

        <!-- ⭐ paid -->
        <template v-else-if="item.billingStatus === 'paid'">
          <BaseButton
            text="查看"
            variant="outline"
            @click.stop="handleView(item)"
          />
        </template>

        <!-- ⭐ void -->
        <template v-else-if="item.billingStatus === 'void'">
          <BaseButton
            text="查看"
            variant="outline"
            @click.stop="handleView(item)"
          />
        </template>

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

    <BillingEditModal
      :errorFields="errorFields"
      v-model:isOpen="isEditModalOpen"
      v-model:isEditing="isEditing"
      v-model="form"
      @save="handleSave"
    />
  </div>
</template>