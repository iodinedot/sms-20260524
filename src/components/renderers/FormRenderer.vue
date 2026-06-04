<script setup>
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'

const { getOptions } = useSettings()

const props = defineProps({
  fields: Object,          // ⭐ 必須是 object
  modelValue: Object,      // ⭐ 整個表單
})

const emit = defineEmits(['update:modelValue'])

const updateField = (key, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

const visibleFields = computed(() => {
  const fields = props.fields || {}

  return Object.entries(fields).filter(([key, field]) => {
    if (!field) return false
    if (field.render === false) return false
    if (field.showIf && !field.showIf(props.modelValue)) return false
    return true
  })
})
</script>

<template>
  <div class="form-grid">
    <div
      v-for="([key, field]) in visibleFields"
      :key="key"
      :class="`col-${field.span ?? 2}`"
    >
      <div class="form-group">
        <div v-if="field && (!field.showIf || field.showIf(modelValue))">
          <label class="form-label">{{ field.label }}</label>
          <!-- text -->
          <input
            v-if="field.type === 'text'"
            type="text"
            :value="modelValue[key]"
            @input="updateField(key, $event.target.value)"
            class="base-input"
          />
          <input
            v-else-if="field.type === 'number'"
            type="number"
            :value="modelValue[key]"
            @input="updateField(key, Number($event.target.value))"
            class="base-input"
          />
          <input
            v-else-if="field.type === 'checkbox'"
            type="checkbox"
            :checked="modelValue[key]"
            @change="updateField(key, $event.target.checked)"
          />
          <input
            v-else-if="field.type === 'date'"
            type="date"
            :value="modelValue[key]"
            @input="updateField(key, $event.target.value)"
            class="base-input"
          />
          <!-- select -->
          <select
            v-else-if="field.type === 'select'"
            :value="modelValue[key]"
            @change="updateField(key, $event.target.value)"
            class="base-select"
          >
            <option value="--請選擇--"">--請選擇--</option>
            <option
              v-for="opt in (
                field.options ||
                getOptions({
                  optionsKey: field.optionsKey,
                  labelKey: 'name',
                  valueKey: 'id'
                })
              )"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
          <textarea
            v-else-if="field.type === 'textarea'"
            :value="modelValue[key]"
            @input="updateField(key, $event.target.value)"
            class="base-textarea"
          />
          <!-- fallback -->
          <div v-else>
            
            不支援欄位類型：{{field}} {{ field.type }}
          </div>
        </div>
      </div>
    </div>
    <slot />
  </div>
</template>