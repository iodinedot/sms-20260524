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

// 👉 本地 state（避免直接改 props）
const local = reactive({
  start: props.modelValue?.start || '',
  end: props.modelValue?.end || '',
  label: props.modelValue?.label || ''
})

// 🔥 watch 外部 → 同步進來
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

// 🔥 watch 內部 → 推回 parent
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
  <div
    style="
      display: flex;
      align-items: center;
      gap: 8px;
      "
  >
    <input
      type="date"
      v-model="local.start"
      class="base-input"
      style="flex: 1;"
    />

    <span style="white-space: nowrap;">~</span>

    <input
      type="date"
      class="base-input"
      v-model="local.end"
      style="flex: 1;"
    />
  </div>
</template>