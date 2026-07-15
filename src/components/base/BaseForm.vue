<script setup>
import { ref, watch, computed } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import FormRenderer from '@/components/shared/FormRenderer.vue'

const props = defineProps({
  schema: Object,
  errorFields: Object,
  modelValue: Object,
  updateField: Function
})

const emit = defineEmits([
  'update:modelValue',
  'close',
  'save'
])

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleSave = () => {
  console.log("handleSave in BaseForm:", props.modelValue)
  emit('save', props.modelValue)
}
</script>
<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>編輯資料</h3>
        <BaseButton variant="outline" text="×" @click="emit('close')" class="close-x" />
      </div>

      <div class="modal-body">
        <FormRenderer
          :fields="schema?.fields"
          v-model="form"
          :errorFields="errorFields"
          :updateField="updateField"
        />
        <slot />
      </div>

      <div class="modal-footer">
        <BaseButton
            variant="outline"
            text="取消"
            @click="emit('close')"
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
  </div>
</template>