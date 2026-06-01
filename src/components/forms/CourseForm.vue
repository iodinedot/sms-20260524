<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSettings } from '../composables/useSettings.js';
import { schemas } from '../schemas'
import BaseButton from '../components/BaseButton.vue';

const { getOptions } = useSettings()

const courseFields = schemas.courses.fields

const props = defineProps({
  modelValue: { type: Object, required: true },
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:isOpen'
])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
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
      startTime: '09:00',
      endTime: '11:00',
    }
  ])
}

const removeScheduleRow = (index) => {
  const schedules = [...(props.modelValue.schedules || [])]
  schedules.splice(index, 1)

  updateField('schedules', schedules)
}

// 計算屬性：自動推算每週堂數
const classCountPerWeek = computed(
  () => props.modelValue.schedules?.length || 0
)
</script>
<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="manager-toolbar">
        
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <div class="form-group">
          <div
            v-for="(field, key) in courseFields"
            :key="key"
            class="form-group"
          >
            <label class="form-label">{{ field.label }}</label>

            <!-- select -->
            <select
              v-if="field.type === 'select'"
              :value="modelValue[key]"
              @change="updateField(key, $event.target.value)"
              class="base-select"
            >
              <option value="">-- 請選擇 ==</option>
              <option
              v-for="opt in getOptions(field)"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>

            <!-- text -->
            <input
              v-else-if="field.type === 'text'"
              :value="modelValue[key]"
              @input="updateField(key, $event.target.value)"
              class="base-input"
            />
          </div>
          <label class="form-label">課程名稱</label>
          <input
            class="base-input"
            placeholder="例如：進階英文寫作"
          />
        </div>

        <div class="form-group">
          <label class="form-label">課程描述</label>
          <textarea
            class="base-textarea"
            placeholder="簡述課程內容..."
          ></textarea>
        </div>

        <div class="form-grid">
          

          <!-- 人數上限 -->
          <div class="form-group" style="margin: 0">
            <label class="form-label">人數上限</label>
            <input
              type="number"
              class="base-input"
              placeholder="例如：10"
            />
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group" style="margin: 0">
            <label class="form-label">排課計費模式</label>
            <select
              class="base-select"
              
            >
              <option value="fixed-weekly">
                模式一：每週固定課程 (設定週幾)
              </option>
              <option value="fixed-period">
                模式二：固定期間單次收費 (例如營隊)
              </option>
            </select>
          </div>

          <div class="form-group" style="margin: 0">
            <label class="form-label">授課老師</label>
            <select class="base-select">
              <option value="">-- 請選擇授課老師 --</option>
              <option v-for="opt in getOptions('teachers')" :key="opt.id" :value="opt.id">
                {{ opt.name }}
              </option>

            </select>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

