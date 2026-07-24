<!-- src/pages/BatchCreatePage.vue -->

<script setup>
import { ref, computed, watch } from 'vue'
import { useManager } from '@/composables/useManager'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'
import { useRouter } from 'vue-router'
import { useBilling } from '@/modules/billing/composables/useBilling'
import { useToolbar } from '@/composables/useToolbar'
import { useTableSelection } from '@/composables/useTableSelection'
import BaseButton from '@/components/base/BaseButton.vue'
import DatePeriod from '@/components/base/DatePeriod.vue'
import SearchBar from '@/components/base/SearchBar.vue'
import FilterTabs from '@/components/base/FilterTabs.vue'
import TableRenderer from '@/components/shared/TableRenderer.vue'

// =========================
// Wizard
// =========================
const step = ref(1)

const canProceed = () => {
  if (step.value === 1) {
    return period.value.start && period.value.end
  }

  if (step.value === 2) {
    return selectedIds.value.length > 0
  }

  return true
}

const canNext = computed(() => canProceed())

const goNext = () => {
  if (!canProceed()) {
    // optional UX
    if (step.value === 1) {
      alert('請先選擇期間')
    } else if (step.value === 2) {
      alert('請先選擇學生')
    }
    return
  }

  step.value++
}

const goPrev = () => {
  if (step.value > 1) {
    step.value--
  }
}

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
  toggleSelectAll
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
  //toolbar,
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
import { useBatchCreate } from '@/modules/billing/composables/useBatchCreate'

const {
  previewList,
  previewMap,
  previewSummary,
  getStudentCourseCount
} = useBatchCreate({
  selectedIds,
  period
})
//import { useEnrollmentService } from '@/modules/enrollment/useEnrollmentService'
//const { activeList } = useEnrollmentService()

/*const previewList = computed(() => {
  if (!period.value.start || !period.value.end) return []
  if (!selectedIds.value.length) return []

  return buildDraftPreview({
    studentIds: selectedIds.value,
    period: period.value
  })
})*/

/*const previewMap = computed(() => {
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
*/
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
    <section v-if="step === 1">
      <h3>期間設定</h3>

      <select class="base-input" v-model="selectedSemesterId">
        <option value="">自訂期間</option>
        <option v-for="s in semesters" :key="s.id" :value="s.id">
          {{ s.name }}
        </option>
      </select>

      <DatePeriod v-model="period" />
      <BaseButton
        text="下一步"
        :disabled="!canNext"
        @click="goNext"
      />
    </section>

    <!-- 🧩 Filter -->
    <section v-if="step === 2">
      <h3>選擇學生</h3>
      <SearchBar
        v-model="keyword"
      />
      <FilterTabs
        :filters="filters"
        :activeFilters="activeFilters"
        @update:filter="updateFilter"
      />

      <!-- ✅ 關鍵：學生表格 -->
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
      />
      <BaseButton text="返回" @click="goPrev" />
      <BaseButton text="下一步" :disabled="!canNext" @click="goNext" />
    </section>

    <!-- 🧩 STEP 3：確認 -->
    <section v-if="step === 3">
      <h3>確認帳單</h3>

      <!-- 🔹 空狀態 -->
      <div v-if="selectedIds.length === 0" class="text-secondary">
        請先選擇學生
      </div>

      <template v-else>
        <!-- 🔥 Summary -->
        <div class="preview-summary">
          <div>選取學生：{{ previewSummary.total }}</div>

          <div>
            ✔ 將建立：{{ previewSummary.newCount }}
          </div>

          <div v-if="previewSummary.duplicates > 0">
            ⚠ 已存在：{{ previewSummary.duplicates }}（將略過）
          </div>

          <div>
            💰 總金額：{{ previewSummary.totalAmount }}
          </div>
        </div>

        <!-- 🔥 單一表格（重點） -->
        <TableRenderer
          :items="previewList"
          :fields="{
            studentName: { label: '學生' },
            courseCount: { label: '課程數' },
            total: { label: '金額' },
            status: { label: '狀態' }
          }"
          :showActions="false"
        >
          <!-- 課程數 -->
          <template #cell-courseCount="{ item }">
            {{ getStudentCourseCount(item.studentId) }}
          </template>

          <!-- 金額 -->
          <template #cell-total="{ value }">
            <span class="text-strong">
              {{ value }}
            </span>
          </template>

          <!-- 狀態 -->
          <template #cell-status="{ value }">
            <span v-if="value === 'duplicate'" class="text-danger">
              已存在
            </span>
            <span v-else class="text-success">
              新增
            </span>
          </template>
        </TableRenderer>

        <!-- 🔘 操作 -->
        <div class="batch-actions">
          <BaseButton
            text="返回"
            variant="outline"
            @click="goPrev"
          />

          <BaseButton
            text="建立帳單"
            icon="🧾"
            variant="primary"
            :disabled="previewSummary.newCount === 0"
            @click="handleCreate"
          />
        </div>
      </template>
    </section>

  </div>
</template>
