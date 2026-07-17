<!-- src/pages/BatchCreatePage.vue -->

<script setup>
import { ref, computed, watch } from 'vue'
import { useManager } from '@/composables/useManager'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'
import { useBilling } from '@/modules/billing/useBilling'

// =========================
// 基礎資料
// =========================
const { list: campuses } = useCrud('campuses')
const { list: semesters } = useCrud('semesters')

const router = useRouter()
const { batchCreateDraft, buildDraftPreview } = useBilling()

// =========================
// 學生（filter-driven）
// =========================
const {
  dataFiltered: studentsFiltered,
  activeFilters
} = useManager({
  type: 'students',
  schema: schemas.students
})

// =========================
// 期間
// =========================
const period = ref({ start: '', end: '' })
const selectedSemesterId = ref('')

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

// 手動改日期 → 清掉 semester
watch(period, () => {
  selectedSemesterId.value = ''
}, { deep: true })

// =========================
// Filter options
// =========================
const gradeOptions = computed(() => {
  const set = new Set(
    studentsFiltered.value.map(s => s.grade).filter(Boolean)
  )
  return Array.from(set).sort()
})

// =========================
// Preview（單一來源）
// =========================
const previewList = computed(() => {
  if (!period.value.start || !period.value.end) return []
  if (!studentsFiltered.value.length) return []

  return buildDraftPreview({
    studentIds: studentsFiltered.value.map(s => s.id),
    period: period.value
  })
})

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

      <input type="date" v-model="period.start" />
      <input type="date" v-model="period.end" />
    </section>

    <!-- 🧩 Filter -->
    <section>
      <select v-model="activeFilters.campusId">
        <option value="">全部校區</option>
        <option v-for="c in campuses" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>

      <select v-model="activeFilters.grade">
        <option value="">全部年級</option>
        <option v-for="g in gradeOptions" :key="g" :value="g">
          {{ g }}
        </option>
      </select>
    </section>

    <!-- 🧩 目標 -->
    <section>
      <h3>目標學生</h3>
      <div>共 {{ studentsFiltered.length }} 人</div>
    </section>

    <!-- 🧩 Preview -->
    <section>
      <h3>預覽</h3>

      <!-- 狀態 1 -->
      <div v-if="!period.start || !period.end">
        請先選擇期間
      </div>

      <!-- 狀態 2 -->
      <div v-else-if="studentsFiltered.length === 0">
        沒有符合條件的學生
      </div>

      <!-- 狀態 3 -->
      <div v-else>
        <!-- 🔥 Summary -->
        <div class="preview-summary">
          <div>總學生：{{ previewSummary.total }}</div>

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

        <!-- 🔍 明細 -->
        <details>
          <summary>查看明細</summary>

          <div
            v-for="item in previewList"
            :key="item.studentId"
            class="preview-item"
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
