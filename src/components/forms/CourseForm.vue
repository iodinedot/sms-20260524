<script setup>
import { ref, computed, watch } from 'vue';
import { schemas } from '@/schemas'
import BaseButton from '@/components/base/BaseButton.vue';
import FieldRenderer from '@/components/renderers/FieldRenderer.vue'
import { WEEKDAY_OPTIONS } from '@/constants/options'

const courseFields = schemas.courses.fields
const visibleFields = Object.fromEntries(
  Object.entries(courseFields)
    .filter(([_, field]) => field.render !== false)
)
const props = defineProps({
  modelValue: Object,
  isOpen: Boolean
})

const emit = defineEmits([
  'update:modelValue',
  'update:isOpen',
  'save'
])

const localCourse = ref({})

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    localCourse.value = JSON.parse(JSON.stringify(props.modelValue))
  },
  { immediate: true }
)

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleSave = () => {
  emit('save', localCourse.value)
}

const closeModal = () => {
  emit('update:isOpen', false);
};

// 模式一操作
const addScheduleRow = () => {
  const schedules = props.modelValue.schedules || []

  updateField('schedules', [
    ...schedules,
    {
      dayOfWeek: 1,
      startTime: '13:00',
      endTime: '15:00',
    }
  ])
}

const removeScheduleRow = (index) => {
  const schedules = [...(props.modelValue.schedules || [])]
  schedules.splice(index, 1)

  updateField('schedules', schedules)
}

const updateScheduleField = (index, key, value) => {
  const schedules = [...(props.modelValue.schedules || [])]

  schedules[index] = {
    ...schedules[index],
    [key]: value
  }

  updateField('schedules', schedules)
}

// 計算屬性：自動推算每週堂數
const classCountPerWeek = computed(
  () => props.modelValue.schedules?.length || 0
)

watch(() => props.modelValue.billingType, (type) => {
  if (type !== 'fixed-weekly') {
    updateField('price', 0)
  }
//可能要刪
  if (type === 'fixed-period') {
    updateField('isCalculatedByTotal', false)
  }
})
</script>
<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="manager-toolbar">
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <FieldRenderer
          :fields="visibleFields"
          :modelValue="localCourse"
          @update:modelValue="val => localCourse = val"
        />
        <!-- 只有 fixed-weekly 才顯示 -->
        <div v-if="['fixed-weekly', 'fixed-semester'].includes(modelValue.billingType)">
          <label class="form-label">上課時間</label>
          <div
            v-for="(row, index) in modelValue.schedules || []"
            :key="index"
            class="schedule-row"
          >
            <!-- 星期 -->
            <select
              :value="row.dayOfWeek"
              @change="updateScheduleField(index, 'dayOfWeek', Number($event.target.value))"
              class="base-select"
            >
              <option
                v-for="opt in WEEKDAY_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>

            <!-- 開始時間 -->
            <input
              type="time"
              :value="row.startTime"
              @input="updateScheduleField(index, 'startTime', $event.target.value)"
              class="base-input"
            />

            <!-- 結束時間 -->
            <input
              type="time"
              :value="row.endTime"
              @input="updateScheduleField(index, 'endTime', $event.target.value)"
              class="base-input"
            />

            <!-- 刪除 -->
            <BaseButton
              variant="danger"
              icon="x"
              text="刪除"
              @click="removeScheduleRow(index)"
              responsive
            />
          </div>

          <!-- 新增 -->
          <BaseButton
            responsive
            variant="primary"
            icon="＋"
            text="新增上課時段"
            title="新增上課時段"
            @click="addScheduleRow"
          />
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <BaseButton
          variant="outline"
          text="取消"
          @click="emit('update:isOpen', false)"
        />
        <BaseButton
          variant="primary"
          icon="💾"
          text="儲存變更"
          @click="handleSave"
          responsive
        />
    </div>
  </div>
</template>

