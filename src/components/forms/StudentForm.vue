<script setup>
import { defineProps, defineEmits } from 'vue';
import { useSettings } from '../composables/useSettings'
import { schemas } from '../schemas'
import BaseButton from '../components/BaseButton.vue';


const { getOptions } = useSettings()

const studentFields = schemas.students.fields

const props = defineProps({
  modelValue: { type: Object, required: true },
  isOpen: { type: Boolean, default: false },
  isReadOnly: { type: Boolean, default: false } // 控制是否唯讀
});

const emit = defineEmits([
  'update:modelValue',
  'update:isOpen'
])

// 當欄位變動時同步回父組件
const updateField = (field, value) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const closeModal = () => {
  emit('update:isOpen', false);
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="form-grid">
      <div
        v-for="(field, key) in studentFields"
        :key="key"
        class="form-group"
      >
        <label class="form-label">{{ field.label }}</label>

        <!-- 🔹 select -->
        <select
          v-if="field.type === 'select'"
          :value="modelValue[key]"
          @change="updateField(key, $event.target.value)"
          class="base-select"
          :disabled="isReadOnly"
        >
          <option value="" disabled>-- 請選擇 --</option>
          <option
            v-for="opt in getOptions(field)"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>

        <!-- 🔹 text -->
        <input
          v-else
          :value="modelValue[key]"
          @input="updateField(key, $event.target.value)"
          class="base-input"
          :readonly="isReadOnly"
        />
      </div>
    </div>

    <div class="form-group" style="margin-top: 16px;">
      <label class="form-label">備註 (過敏、特殊狀況)</label>
      <textarea 
        :value="modelValue.note" 
        @input="updateField('note', $event.target.value)"
        class="base-textarea" 
        :readonly="isReadOnly"
      ></textarea>
    </div>
    <div class="toolbar">
      <BaseButton variant="outline" text="取消" @click="closeModal" />
      <BaseButton
        responsive
        variant="primary"
        icon="✓"
        text="確認新增"
        @click="saveStudent"
      />        
    </div>
  </div>
</template>