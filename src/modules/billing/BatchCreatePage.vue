<!-- src/pages/BatchCreatePage.vue -->

<script setup>
import { ref, computed, watch } from 'vue'
import { useManager } from '@/composables/useManager'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'
import { useRouter } from 'vue-router'
import { useBilling } from '@/modules/billing/useBilling'
import { useToolbar } from '@/composables/useToolbar'
import { useTableSelection } from '@/composables/useTableSelection'
import BaseButton from '@/components/base/BaseButton.vue'
import DatePeriod from '@/components/base/DatePeriod.vue'
import SearchBar from '@/components/base/SearchBar.vue'
import FilterTabs from '@/components/base/FilterTabs.vue'
import TableRenderer from '@/components/shared/TableRenderer.vue'

// =========================
// 基礎資料
// =========================
const { list: semesters } = useCrud('semesters')

const router = useRouter()
const { batchCreateDraft, buildDraftPreview } = useBilling()

// =========================
// 學生（filter-driven）
// =========================
const keyword = ref('')
const {
  dataFiltered: studentsFiltered,
  activeFilters
} = useManager({
  type: 'students',
  schema: schemas.students,
  keyword
})

// =========================
// 選取
// =========================
const {
  selectedIds,
  toggleSelect,
  isAllSelected,
  toggleSelectAll,
  clearSelection
} = useTableSelection(
  studentsFiltered,
  {
    preserveSelection: true
  }
)

// =========================
// Toolbar
// =========================
const {
  toolbar,
  filters
} = useToolbar({
  schema: schemas.students,
  type:'students',
  selectedIds,
  items: studentsFiltered
})

// =========================
// 期間
// =========================
const period = ref({
  start: '',
  end: '',
  label: ''
})
const selectedSemesterId = ref('')

const selectedSemester = computed(() =>
  semesters.value.find(s => s.id === selectedSemesterId.value)
)

watch(selectedSemester, (sem) => {
  if (!sem) return

  period.value = {
    start: sem.period?.start || '',
    end: sem.period?.end || '',
    label: sem.name || ''
  }
})

// 手動改日期 → 清掉 semester
watch(period, () => {
  selectedSemesterId.value = ''
}, { deep: true })

// =========================
// Preview（單一來源）
// =========================
import { useEnrollmentService } from '@/modules/enrollment/useEnrollmentService'
const { activeList } = useEnrollmentService()

const previewList = computed(() => {
  if (!period.value.start || !period.value.end) return []
  if (!selectedIds.value.length) return []

  return buildDraftPreview({
    studentIds: selectedIds.value,
    period: period.value
  })
})

const previewMap = computed(() => {
  const map = {}

  for (const item of previewList.value) {
    map[item.studentId] = item
  }

  return map
})

const courseCountMap = computed(() => {
  const map = {}

  for (const e of activeList.value) {
    if (!map[e.studentId]) {
      map[e.studentId] = 0
    }
    map[e.studentId]++
  }

  return map
})

const getCourseCount = (studentId) => {
  return courseCountMap.value[studentId] || 0
}

// =========================
// 🔥 Summary（唯一真相）
// =========================
const previewSummary = computed(() => {
  let total = previewList.value.length
  let newCount = 0
  let duplicates = 0
  let totalAmount = 0

  for (const item of previewList.value) {
    if (item.status === 'duplicate') {
      duplicates++
    } else {
      newCount++
      totalAmount += item.total || 0
    }
  }

  return {
    total,
    newCount,
    duplicates,
    totalAmount
  }
})

const updateFilter = ({key,value})=>{
  activeFilters.value = {
    ...activeFilters.value,
    [key]: value
  }
}

// =========================
// Create
// =========================
const handleCreate = async () => {
  if (!previewList.value.length) return

  const studentIds = previewList.value.map(i => i.studentId)

  await batchCreateDraft({
    selection: {
      type: 'manual',
      studentIds
    },
    period: period.value
  })

  router.push('/billing')
}
</script>

<template>
  <div class="batch-page">
    <h2>批次建立帳單</h2>

    <!-- 🧩 期間 -->
    <section>
      <h3>期間設定</h3>

      <select class="base-input" v-model="selectedSemesterId">
        <option value="">自訂期間</option>
        <option v-for="s in semesters" :key="s.id" :value="s.id">
          {{ s.name }}
        </option>
      </select>

      <DatePeriod v-model="period" />
    </section>

    <!-- 🧩 Filter -->
    <section>
      <h3>學生篩選</h3>
      <SearchBar
        v-model="keyword"
      />

      <FilterTabs
        :filters="filters"
        :activeFilters="activeFilters"
        @update:filter="updateFilter"
      />
    </section>

    <!-- 🧩 目標 -->
    <section>
      <h3>目標學生</h3>

      <div class="text-secondary">
        共 {{ studentsFiltered.length }} 人 ｜ 已選 {{ selectedIds.length }} 人
      </div>
      <TableRenderer
        :items="studentsFiltered"
        :fields="schemas.students.fields"
        selectable
        :selectedIds="selectedIds"
        :isAllSelected="isAllSelected"
        :showActions="false"
        @toggle-select="toggleSelect"
        @toggle-select-all="toggleSelectAll"
        :extraColumns="[
          { key: 'courseCount', label: '課程數' },
          { key: 'amount', label: '預估金額' }
        ]"
      >
        <!-- 課程數 -->
        <template #extra-courseCount="{ item }">
          {{ getCourseCount(item.id) }}
        </template>

        <!-- 金額 -->
        <template #extra-amount="{ item }">
          <span v-if="!previewMap[item.id]" class="text-secondary">
            -
          </span>
          <span v-else>
            {{ previewMap[item.id].total }}
          </span>
        </template>

      </TableRenderer>
    </section>

    <!-- 🧩 Preview -->
    <section>
  <h3>預覽</h3>
    <!-- 狀態 1 -->
    <div v-if="!period.start || !period.end">
      請先選擇期間
    </div>
    <!-- 狀態 2 -->
    <div v-else-if="selectedIds.length === 0">
      請先選擇學生
    </div>
    <!-- 狀態 3 -->
    <div v-else>
      <!-- 🔥 Summary -->
      <div class="preview-summary">
        <div>選取學生：{{ previewSummary.total }}</div>
        <div>
          ✔ 將建立：{{ previewSummary.newCount }}
        </div>
        <div v-if="previewSummary.duplicates > 0">
          ⚠ 已存在：{{ previewSummary.duplicates }}
        </div>
        <div>
          💰 總金額：{{ previewSummary.totalAmount }}
        </div>
      </div>

      <!-- 🔥 明細（改 Table） -->
      <TableRenderer
        :items="previewList"
        :fields="{
          studentName: { label: '學生' },
          total: { label: '金額' },
          status: { label: '狀態' }
        }"
        :showActions="false"
      >
        <template #cell-status="{ value }">
          <span v-if="value === 'duplicate'" class="text-danger">
            已存在
          </span>
          <span v-else class="text-success">
            新增
          </span>
        </template>
      </TableRenderer>
    </div>
  </section>

    <!-- 🧩 Action -->
    <section>
      <BaseButton
        text="建立帳單"
        icon="🧾"
        variant="primary"
        :disabled="previewSummary.newCount === 0"
        @click="handleCreate"
      />
    </section>

  </div>
</template>
