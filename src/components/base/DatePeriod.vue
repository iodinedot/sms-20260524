<script setup>
import { watch, reactive } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      start: '',
      end: '',
      label: ''
    })
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const local = reactive({
  start: props.modelValue?.start || '',
  end: props.modelValue?.end || '',
  label: props.modelValue?.label || ''
})

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return
    local.start = val.start || ''
    local.end = val.end || ''
    local.label = val.label || ''
  },
  { deep: true, immediate: true }
)

watch(
  local,
  (val) => {
    const updated = {
      start: val.start,
      end: val.end,
      label: val.label || (val.start && val.end ? `${val.start} ~ ${val.end}` : '')
    }

    emit('update:modelValue', updated)
  },
  { deep: true }
)
</script>

<template>
  <div class="date-range">
    <input
      type="date"
      v-model="local.start"
      class="base-input"
    />

    <span class="separator">~</span>

    <input
      type="date"
      v-model="local.end"
      class="base-input"
    />
  </div>
</template>

<style>
.date-range {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: 8px;
  align-items: center;
}

.date-range .base-input {
  width: 100%;
}

.separator {
  background: transparent;
  border: none;
  padding: 0;
  text-align: center;
  color: var(--text-secondary);
}
</style>