<!-- src/pages/BatchCreatePage.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useManager } from '@/composables/useManager'
import { useCrud } from '@/composables/useCrud'
import { useTableSelection } from '@/composables/useTableSelection'
import { schemas } from '@/schemas'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'

const { list: campuses } = useCrud('campuses')

// ⭐ student filter（完全 reuse）
const {
  dataFiltered: studentsFiltered,
  activeFilters
} = useManager({
  type: 'students',
  schema: schemas.students,
  useSearch: true
})

const { list: semesters } = useCrud('semesters')

// ⭐ selection（直接 reuse）
const {
  selectedIds,
  toggleSelect,
  isAllSelected,
  toggleSelectAll,
  clearSelection
} = useTableSelection(studentsFiltered)

// ⭐ period（先最小版本）
const period = ref({
  start: '',
  end: ''
})

// ⭐ create handler（先接你的既有邏輯）
import { useBilling } from '@/modules/billing/useBilling'

const { batchCreateDraft } = useBilling()

const router = useRouter()

const handleCreate = async () => {
  if (!selectedIds.value.length) return

  await batchCreateDraft({
    selection: {
      type: 'manual',
      studentIds: selectedIds.value
    },
    period: period.value
  })

  clearSelection()
  router.push('/billing')
}

const selectedSemesterId = ref('')

// ⭐ 自動找到 semester
const selectedSemester = computed(() =>
  semesters.value.find(s => s.id === selectedSemesterId.value)
)

watch(selectedSemester, (sem) => {
  if (!sem) return

  period.value = {
    start: sem.period?.start || '',
    end: sem.period?.end || ''
  }
})

watch(period, () => {
  selectedSemesterId.value = ''
}, { deep: true })

const gradeOptions = computed(() => {
  const set = new Set(
    studentsFiltered.value.map(s => s.grade).filter(Boolean)
  )

  return Array.from(set).sort()
})
</script>

<template>
  <div class="batch-page">
    <h2>批次建立帳單</h2>

    <!-- 🧩 Section 1：期間 -->
    <section>
      <h3>期間設定</h3>
      <select class="base-input" v-model="selectedSemesterId">
        <option value="">自訂期間</option>

        <option
          v-for="s in semesters"
          :key="s.id"
          :value="s.id"
        >
          {{ s.name }}
        </option>
      </select>
      <input
        type="date"
        v-model="period.start"
      />
      <input
        type="date"
        v-model="period.end"
      />
    </section>

    <!-- 🧩 Section 2：filter（先 minimal） -->
    <section>
      <select v-model="activeFilters.campusId">
        <option value="">全部校區</option>

        <option
          v-for="c in campuses"
          :key="c.id"
          :value="c.id"
        >
          {{ c.name }}
        </option>
      </select>

      <!-- 範例：年級 -->
      <select v-model="activeFilters.grade">
        <option value="">全部年級</option>

        <option
          v-for="g in gradeOptions"
          :key="g"
          :value="g"
        >
          {{ g }}
        </option>
      </select>
    </section>

    <!-- 🧩 Section 3：學生選擇 -->
    <section>
      <h3>選擇學生（{{ studentsFiltered.length }}）</h3>

      <label>
        <input
          type="checkbox"
          :checked="isAllSelected"
          @change="toggleSelectAll"
        />
        全選
      </label>

      <div v-for="s in studentsFiltered" :key="s.id">
        <label>
          <input
            type="checkbox"
            :checked="selectedIds.includes(s.id)"
            @change="toggleSelect(s.id)"
          />
          {{ s.chName }}
        </label>
      </div>
    </section>

    <!-- 🧩 Section 4：actions -->
    <section>
      <BaseButton
        text="建立帳單"
        icon="🧾"
        variant="primary"
        :disabled="selectedIds.length === 0"
        @click="handleCreate"
      />
    </section>
  </div>
</template>