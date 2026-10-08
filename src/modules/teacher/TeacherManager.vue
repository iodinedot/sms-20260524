<script setup>
import BaseManager from '@/components/base/BaseManager.vue'
import { useCrud } from '@/composables/useCrud'

// courses 已經由 initGlobalSubscriptions（App 啟動時）確保訂閱，
// 這裡不需要再自己呼叫 ensureSubscribed。
const { list: courses } = useCrud('courses')

const extraColumns = [
  { key: 'courses', label: '教授課程' }
]

const getTeachingCourses = (teacherId) =>
  courses.value.filter(c => c.teacherId === teacherId)
</script>

<template>
  <BaseManager
    type="teachers"
    :show-title="true"
    :extra-columns="extraColumns"
  >
    <template #extra-courses="{ item }">
      <span v-if="getTeachingCourses(item.id).length">
        {{ getTeachingCourses(item.id).map(c => c.name).join('、') }}
      </span>
      <span v-else class="text-muted">無</span>
    </template>

    <template #form-extra>
      <p class="form-hint">
        ※ 若要調整此教師教授的課程，請至「課程資料設定」頁面編輯課程的「授課教師」欄位。
      </p>
    </template>
  </BaseManager>
</template>