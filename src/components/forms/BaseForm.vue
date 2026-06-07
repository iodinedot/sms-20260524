<script setup>
import { ref, watch } from 'vue';
import BaseButton from '@/components/base/BaseButton.vue';
import FormRenderer from '@/components/renderers/FormRenderer.vue'

const props = defineProps({
  schema: Object,
  errors: Object,
  modelValue: Object,
  isOpen: Boolean
})

const emit = defineEmits([
  'update:modelValue',
  'update:isOpen',
  'save'
])

const localItem = ref({})

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    localItem.value = JSON.parse(JSON.stringify(props.modelValue))
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
  emit('save', localItem.value)
}

const closeModal = () => {
  emit('update:isOpen', false);
};
</script>
<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h3>編輯資料</h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <FormRenderer
          :fields="schema?.fields"
          :modelValue="localItem"
          :errors="errors"
          @update:modelValue="val => localItem = val"
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

