<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';
import { adminService } from '../services/adminService.js';

const props = defineProps({
  modelValue: { type: Object, required: true },
  isReadOnly: { type: Boolean, default: false } // 控制是否唯讀
});

const emit = defineEmits(['update:modelValue']);

// 💡 升級為標準校區對照清單，與 Firebase 的 campusId 完全接軌
const campusList = ref([]);

// 於組件掛載時，統一從 Service 層的單一真實來源獲取最新校區資訊
onMounted(async () => {
  try {
    const settings = await adminService.getSettings();
    if (settings && settings.campuses) {
      campusList.value = settings.campuses;
    }
  } catch (error) {
    console.error('載入校區資訊失敗：', error);
  }
});

// 當欄位變動時同步回父組件
const updateField = (field, value) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};
</script>

<template>
  <div class="student-form-template">
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">所屬校區</label>
        <select 
          :value="modelValue.campusId" 
          @change="updateField('campusId', $event.target.value)"
          class="base-select"
          :disabled="isReadOnly"
        >
          <option value="" disabled>-- 請選擇校區 --</option>
          <option v-for="c in campusList" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">中文姓名</label>
        <input 
          :value="modelValue.chName" 
          @input="updateField('chName', $event.target.value)"
          class="base-input" 
          :readonly="isReadOnly"
        />
      </div>

      <div class="form-group">
        <label class="form-label">英文姓名</label>
        <input 
          :value="modelValue.enName" 
          @input="updateField('enName', $event.target.value)"
          class="base-input" 
          :readonly="isReadOnly" 
        />
      </div>

      <div class="form-group">
        <label class="form-label">性別</label>
        <select 
          :value="modelValue.gender" 
          @change="updateField('gender', $event.target.value)"
          class="base-select"
          :disabled="isReadOnly"
        >
          <option value="M">男</option>
          <option value="F">女</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">年級</label>
        <input 
          :value="modelValue.grade" 
          @input="updateField('grade', $event.target.value)"
          class="base-input" 
          :readonly="isReadOnly" 
        />
      </div>

      <div class="form-group">
        <label class="form-label">家長電話</label>
        <input 
          :value="modelValue.parentPhone" 
          @input="updateField('parentPhone', $event.target.value)"
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
  </div>
</template>