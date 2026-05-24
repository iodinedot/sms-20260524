<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="page-title" style="margin: 0; flex: 1">
          設定選修課程 - {{ student?.chName
          }}{{ student?.enName ? ` (${student.enName})` : '' }}
        </h3>
        <OutlineButton text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <div class="form-group">
          <SearchBar
            v-model="courseSearchQuery"
            placeholder="輸入課程名稱搜尋..."
          />
        </div>

        <div class="form-group">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="form-group"
            :style="course.isValid === false ? 'opacity: 0.6; cursor: not-allowed; padding: 4px 0;' : 'cursor: pointer; padding: 4px 0;'"
            @click="course.isValid !== false && toggleCourse(course.id)"
          >
            <div style="display: flex; align-items: flex-start; gap: 8px;">
              <input
                type="checkbox"
                :id="'chk-' + course.id"
                :value="course.id"
                v-model="localSelectedCourseIds"
                :disabled="course.isValid === false"
                @click.stop
              />
              <label :for="'chk-' + course.id" :style="course.isValid === false ? 'cursor: not-allowed;' : 'cursor: pointer;'" class="form-label" style="margin: 0; flex: 1;">
                <span v-if="course.isValid === false" style="color: #dc3545; font-weight: bold; margin-right: 6px;">
                  [已停開]
                </span>
                <span :class="course.isValid === false ? 'text-secondary' : 'text-primary'">{{ course.name }}</span>

                <span
                  class="text-secondary"
                  style="font-size: 0.85rem; display: block; margin-top: 4px"
                >
                  <template v-if="course.billingType === 'fixed-weekly'">
                    每週固定課程
                    <span
                      v-if="course.isCalculatedByTotal"
                      style="color: var(--btn-primary-text)"
                    >
                      (學期總價 NT$
                      {{ (course.fixedTotalAmount || 0).toLocaleString() }})
                    </span>
                    <span v-else>
                      (單堂 NT$
                      {{ (course.unitPrice || 0).toLocaleString() }})
                    </span>
                  </template>

                  <template v-else-if="course.billingType === 'fixed-period'">
                    <span
                      style="color: var(--btn-success-text); font-weight: 500"
                    >
                      固定期間收費
                    </span>
                    <span>
                      ({{ course.startDate }} ~ {{ course.endDate }}) ——
                    </span>
                    <span
                      style="color: var(--btn-primary-text); font-weight: 500"
                    >
                      NT$
                      {{ (course.fixedTotalAmount || 0).toLocaleString() }}
                    </span>
                  </template>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <OutlineButton 
          text="取消" 
          @click="closeModal" 
          :disabled="isSaving" 
        />
      
        <ResponsiveButton
          variant="primary"
          icon="✓"
          :text="isSaving ? '儲存中...' : '儲存變更'"
          :disabled="isSaving"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import { studentService } from '../services/studentService.js';
import {
  ResponsiveButton,
  OutlineButton
} from '../components/Buttons.vue';

const props = defineProps({
  isOpen: Boolean,
  student: Object,
  allCourses: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:isOpen', 'saved']);

// --- 本地響應式變數 ---
const courseSearchQuery = ref('');
const localSelectedCourseIds = ref([]);
const isSaving = ref(false);

// 監聽彈窗開啟，只要一打開，就將該學生的原本選課資料(courseIds)複製到本地暫存
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.student) {
      localSelectedCourseIds.value = [...(props.student.courseIds || [])];
      courseSearchQuery.value = ''; // 每次打開清空搜尋文字
    }
  }
);

const filteredCourses = computed(() => {
  // 步驟 A：先過濾掉所有「已經被軟刪除，且當前學生根本沒選」的無效課程
  // 也就是說：只有「有效課程」以及「已被軟刪除但屬於當前學生的歷史選課」能留下來
  const currentStudentCourseIds = props.student?.courseIds || [];
  
  let availableCourses = props.allCourses.filter((c) => {
    const isCurrentlySelected = currentStudentCourseIds.includes(c.id);
    const isValidCourse = c.isValid !== false; // 判定是否為有效課程
    
    return isValidCourse || isCurrentlySelected;
  });

  // 步驟 B：再處理原本的關鍵字搜尋
  if (!courseSearchQuery.value.trim()) return availableCourses;
  
  const keyword = courseSearchQuery.value.toLowerCase();
  return availableCourses.filter((c) =>
    (c.name || '').toLowerCase().includes(keyword)
  );
});

// 點擊整列就能切換勾選狀態的輔助函數
const toggleCourse = (courseId) => {
  const index = localSelectedCourseIds.value.indexOf(courseId);
  if (index > -1) {
    localSelectedCourseIds.value.splice(index, 1); // 已存在則移除
  } else {
    localSelectedCourseIds.value.push(courseId); // 不存在則加入
  }
};

const closeModal = () => {
  if (isSaving.value) return;
  emit('update:isOpen', false);
};

// 🎯 完美修復後的儲存處理
const handleSave = async () => {
  if (!props.student?.id) return;

  isSaving.value = true;
  try {
    // ✨ 修正點 1：使用您更新後的名稱 saveStudentCourses
    // ✨ 修正點 2：第二個參數直接傳入純陣列（localSelectedCourseIds.value）
    await studentService.updateStudentCourses(
      props.student.id,
      localSelectedCourseIds.value
    );
    alert('儲存完成！');
    emit('saved'); // 通知父組件重新整理學生列表
    closeModal(); // 關閉彈窗
  } catch (error) {
    console.error('儲存選課失敗:', error);
    alert('儲存選課時發生錯誤，請稍後再試');
  } finally {
    isSaving.value = false;
  }
};
</script>
