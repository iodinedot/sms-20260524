<script setup>
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { filterFields } from '@/utils/fieldFilter'
import PeriodInput from '@/components/base/PeriodInput.vue'

const { getOptions } = useSettings()

const props = defineProps({
  fields: Object,
  modelValue: Object,
  errors: Object
})

const emit = defineEmits(['update:modelValue'])

const updateField = (key, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

const visibleFields = computed(() => {
  return filterFields(props.fields, props.modelValue, 'form')
})

const resolveOptions = (field) => {
  return field.options ||
    getOptions({
      optionsKey: field.optionsKey,
      labelKey: 'name',
      valueKey: 'id'
    })
}

const isCustomField = (field) => {
  return field.type === 'period'
}

const resolveComponent = (field) => {
  if (field.type === 'period') return PeriodInput
  return null
}
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

          <label class="form-label">
            {{ field.label }}
          </label>

          <!-- ======================= -->
          <!-- 1. CUSTOM COMPONENT -->
          <!-- ======================= -->
          <component
            v-if="isCustomField(field)"
            :is="resolveComponent(field)"
            v-model="modelValue[key]"
          />

          <!-- ======================= -->
          <!-- 2. SELECT -->
          <!-- ======================= -->
          <select
            v-else-if="field.type === 'select'"
            :value="modelValue[key]"
            @change="updateField(key, $event.target.value)"
            class="base-select"
          >
            <option value="">--請選擇--</option>

            <option
              v-for="opt in resolveOptions(field)"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>

          <!-- ======================= -->
          <!-- 3. TEXT -->
          <!-- ======================= -->
          <input
            v-else-if="field.type === 'text'"
            type="text"
            class="base-input"
            :value="modelValue[key]"
            @input="updateField(key, $event.target.value)"
          />

          <!-- ======================= -->
          <!-- 4. NUMBER -->
          <!-- ======================= -->
          <input
            v-else-if="field.type === 'number'"
            type="number"
            class="base-input"
            :value="modelValue[key]"
            @input="updateField(key, Number($event.target.value))"
          />

          <!-- ======================= -->
          <!-- 5. CHECKBOX -->
          <!-- ======================= -->
          <input
            v-else-if="field.type === 'checkbox'"
            type="checkbox"
            :checked="modelValue[key]"
            @change="updateField(key, $event.target.checked)"
          />

          <!-- ======================= -->
          <!-- 6. DATE -->
          <!-- ======================= -->
          <input
            v-else-if="field.type === 'date'"
            type="date"
            class="base-input"
            :value="modelValue[key]"
            @input="updateField(key, $event.target.value)"
          />

          <!-- ======================= -->
          <!-- 7. TEXTAREA -->
          <!-- ======================= -->
          <textarea
            v-else-if="field.type === 'textarea'"
            class="base-textarea"
            :value="modelValue[key]"
            @input="updateField(key, $event.target.value)"
          />

          <!-- ======================= -->
          <!-- 8. FALLBACK -->
          <!-- ======================= -->
          <div v-else>
            不支援欄位類型：{{ field.type }}
          </div>

          <!-- ======================= -->
          <!-- ERROR -->
          <!-- ======================= -->
          <div v-if="errors[key]" class="error-text">
            {{ errors[key] }}
          </div>

        </div>

      </div>
    </div>

    <slot />
  </div>
</template>