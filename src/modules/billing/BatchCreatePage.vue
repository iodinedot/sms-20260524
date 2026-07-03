<!-- src/pages/BatchCreatePage.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useManager } from '@/composables/useManager'
import { useCrud } from '@/composables/useCrud'
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

// ⭐ period（先最小版本）
const period = ref({
  start: '',
  end: ''
})

// ⭐ create handler（先接你的既有邏輯）
import { useBilling } from '@/modules/billing/useBilling'

const { batchCreateDraft, buildDraftPreview } = useBilling()

const router = useRouter()

const handleCreate = async () => {
  const studentIds = studentsFiltered.value.map(s => s.id)

  if (!studentIds.length) return
  if (!period.value.start || !period.value.end) return

  await batchCreateDraft({
    selection: {
      type: 'manual', // 先維持，不動 useBilling
      studentIds
    },
    period: period.value
  })

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

const previewList = computed(() => {
  if (!studentsFiltered.value.length) return []

  if (!period.value.start || !period.value.end) return []

  return buildDraftPreview({
    studentIds: studentsFiltered.value.map(s => s.id),
    period: period.value
  })
})

const previewSummary = computed(() => {
  const totalStudents = previewList.value.length

  const totalAmount = previewList.value.reduce(
    (sum, i) => sum + (i.total || 0),
    0
  )

  return {
    totalStudents,
    totalAmount
  }
})

const duplicates = previewList.value.filter(i => i.status === 'duplicate').length
const newCount = previewList.value.length - duplicates
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

    <!-- 🧩 Section 4：actions -->
    <section>
      <h3>目標學生</h3>
      <div>共 {{ studentsFiltered.length }} 人</div>
    </section>
    <section>
      <h3>預覽</h3>

      <!-- 狀態 1：沒選期間 -->
      <div v-if="!period.start || !period.end">
        請先選擇期間
      </div>

      <!-- 狀態 2：沒學生 -->
      <div v-else-if="studentsFiltered.length === 0">
        沒有符合條件的學生
      </div>

      <!-- 狀態 3：正常 preview -->
      <div v-else>
        <div>總學生：{{ previewSummary.total }}</div>
        <div>將建立：{{ previewSummary.newCount }}</div>

        <div v-if="previewSummary.duplicates">
          ⚠ 已存在：{{ previewSummary.duplicates }}（將略過）
        </div>
        <div class="preview-summary">
          <div>學生數：{{ previewSummary.totalStudents }}</div>
          <div>總金額：{{ previewSummary.totalAmount }}</div>
        </div>

        <details>
          <summary>查看明細</summary>

          <div
            v-for="item in previewList"
            :key="item.studentId"
          >
            <strong>{{ item.studentName }}</strong>
            - {{ item.total }}

            <span v-if="item.status === 'duplicate'">
              ⚠ 已存在（將略過）
            </span>
          </div>
        </details>
      </div>
    </section>
    <section>
      <BaseButton
        text="建立帳單"
        icon="🧾"
        variant="primary"
        :disabled="previewList.length === 0"
        @click="handleCreate"
      />
    </section>
  </div>
</template>