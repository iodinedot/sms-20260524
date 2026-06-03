<script setup>
import { ref, computed, watch } from 'vue';
import { schemas } from '@/schemas'
import BaseButton from '@/components/base/BaseButton.vue';
import FieldRenderer from '@/components/renderers/FieldRenderer.vue'

const studentFields = schemas.students.fields
const visibleFields = Object.fromEntries(
  Object.entries(studentFields)
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

const localStudent = ref({})

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    localStudent.value = JSON.parse(JSON.stringify(props.modelValue))
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
  emit('save', localStudent.value)
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
          :modelValue="localStudent"
          @update:modelValue="val => localStudent = val"
        />
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

