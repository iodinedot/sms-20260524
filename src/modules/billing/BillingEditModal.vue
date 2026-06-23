<script setup>
import { computed } from 'vue';
import { schemas } from '@/schemas'
import BaseButton from '@/components/base/BaseButton.vue';
import FormRenderer from '@/components/shared/FormRenderer.vue'

const billingFields = schemas.billings.fields

const props = defineProps({
  isOpen: Boolean,
  isEditing: Boolean,
  modelValue: Object,
  errorFields: Object,
})

const emit = defineEmits([
  'update:modelValue',
  'update:isOpen',
  'save'
])

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const closeModal = () => {
  emit('update:isOpen', false)
}

const handleSave = () => {
  console.log("handleSave in BillingEditModal:", props.modelValue)
  emit('save', props.modelValue)
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>
          {{ isEditing ? '編輯帳單' : '新增帳單' }}
        </h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        
        <FormRenderer
          :fields="billingFields"
          v-model="form"
          :errorFields="errorFields"
        />
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
  </div>
</template>