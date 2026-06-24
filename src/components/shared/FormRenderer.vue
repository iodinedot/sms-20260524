<script setup>
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { filterFields } from '@/utils/fieldFilter'
import DatePeriod from '@/components/base/DatePeriod.vue'
import TimePeriodArray from '@/components/base/TimePeriodArray.vue'
import FeeItemsEditor from '@/modules/billing/FeeItemsEditor.vue'
import CourseItemsEditor from '@/modules/billing/CourseItemsEditor.vue'

const componentMap = {
  DatePeriod,
  TimePeriodArray,
  FeeItemsEditor,
  CourseItemsEditor
}

const { getOptions } = useSettings()

const props = defineProps({
  fields: Object,
  modelValue: Object,
  errorFields: Object
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
  return field.type === 'custom' || field.component
}

const resolveComponent = (field) => {
  // 🔥 1. 優先吃 schema.component
  if (field.component && componentMap[field.component]) {
    return componentMap[field.component]
  }

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
          <!-- 🔒 READONLY DISPLAY（最高優先） -->
          <!-- ======================= -->
          <template v-if="field.readonly">
            <span v-if="field.format">
              {{ field.format(modelValue[key]) }}
            </span>

            <span v-else>
              {{ modelValue[key] }}
            </span>
          </template>
          <component
            v-else-if="isCustomField(field)"
            :is="resolveComponent(field)"
            v-model="modelValue[key]"
          />

          <!-- ======================= -->
          <!-- ✏️ EDITABLE -->
          <!-- ======================= -->
          <template v-else>
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
              @input="updateField(key, $event.target.value)"
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
            <div v-if="errorFields[key]" class="error-text">
              {{ errorFields[key] }}
            </div>
          </template>
        </div>

      </div>
    </div>

    <slot />
  </div>
</template>