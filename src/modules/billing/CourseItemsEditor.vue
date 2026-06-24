<script setup>
import { computed } from 'vue'
import { getBillingTypeLabel } from '@/constants/options'
import { updateCourseItem } from '@/modules/billing/billingCalculator'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const items = computed(() => props.modelValue || [])

// 🔥 唯一入口：修改 lessonCount
const onLessonChange = (item, value) => {
  if (item.billingType !== 'weekly-by-lesson') return

  const updated = updateCourseItem(item, value)

  const newList = items.value.map(i =>
    i.courseId === item.courseId ? updated : i
  )

  emit('update:modelValue', newList)
}
</script>

<template>
  <div class="course-items-editor">

    <table class="base-table">
      <thead>
        <tr>
          <th>課程</th>
          <th>老師</th>
          <th>計費方式</th>
          <th>堂數</th>
          <th>單價</th>
          <th>小計</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in items" :key="item.courseId">
          
          <!-- 課程 -->
          <td>{{ item.name }}</td>

          <!-- 老師 -->
          <td>{{ item.teacherName }}</td>

          <!-- 計費方式 -->
          <td>{{ getBillingTypeLabel(item.billingType) }}</td>

          <!-- 堂數 -->
          <td>
            <input
              v-if="item.billingType !== 'period-total'"
              type="number"
              min="0"
              class="base-input"
              :value="item.lessonCount"
              @input="onLessonChange(item, $event.target.value)"
              style="width: 80px;"
            />
            <span v-else>-</span>
          </td>

          <!-- 單價 -->
          <td>
            {{ item.billingType === 'weekly-by-lesson' ? (item.unitPrice || 0) : '-' }}
          </td>

          <!-- 小計 -->
          <td>{{ item.subtotal || 0 }}</td>

        </tr>

        <!-- 空狀態 -->
        <tr v-if="!items.length">
          <td colspan="6" style="text-align: center; color: #999;">
            尚無課程資料
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>