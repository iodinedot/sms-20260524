<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="page-title" style="margin: 0; flex: 1">
          設定選修課程 - {{ student?.chName
          }}{{ student?.enName ? ` (${student.enName})` : '' }}
        </h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <div class="form-group">
          <SearchBar
            v-model="searchQuery"
            placeholder="輸入課程名稱搜尋..."
          />
        </div>

        <div class="form-group">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            @click="toggleCourse(course.id)"
            style="cursor: pointer;"
          >
            <input
              type="checkbox"
              :id="'chk-' + course.id"
              :value="course.id"
              :disabled="course.isValid === false"
              @click.stop
              :checked="selectedIds.has(course.id)"
              @change.stop="toggleCourse(course.id)"
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

      <div class="modal-footer">
        <BaseButton variant="outline" 
          text="取消" 
          @click="closeModal" 
          :disabled="isSaving" 
        />
      
        <BaseButton
          responsive
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
import { courseService } from '../services/courseService.js';
import { enrollmentService } from '../services/enrollmentService'
import BaseButton from '../components/BaseButton.vue';

const props = defineProps({
  isOpen: Boolean,
  student: Object,
});

const emit = defineEmits(['update:isOpen', 'saved']);

// --- 本地響應式變數 ---
const courses = ref([])
const enrollments = ref([])
const selectedIds = ref(new Set())

const searchQuery = ref('')
const statusFilter = ref('all')
const isSaving = ref(false)


const loadData = async () => {
  courses.value = await courseService.getCoursesByCampus(
    props.student.campusId
  )

  enrollments.value = await enrollmentService.getByStudent(
    props.student.id
  )

  selectedIds.value = new Set(
    enrollments.value
      .filter(e => e.status === 'active')
      .map(e => e.courseId)
  )
}

const mergedCourses = computed(() => {
  return courses.value.map(course => {
    const isActive = selectedIds.value.has(course.id)

    return {
      ...course,
      courseStatus: isActive ? 'active' : 'not_active'
    }
  })
})

// 監聽彈窗開啟，只要一打開，就將該學生的原本選課資料(courseIds)複製到本地暫存
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      loadData()
      searchQuery.value = ''; // 每次打開清空搜尋文字
    }
  }
)

const filteredCourses = computed(() => {
  let list = mergedCourses.value

  if (statusFilter.value === 'active') {
    list = list.filter(c => c.courseStatus === 'active')
  } else if (statusFilter.value === 'not_active') {
    list = list.filter(c => c.courseStatus === 'not_active')
  }

  if (!searchQuery.value.trim()) return list

  const keyword = searchQuery.value.toLowerCase()

  return list.filter(c =>
    (c.name || '').toLowerCase().includes(keyword)
  )
})

const toggleCourse = (id) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const closeModal = () => {
  if (isSaving.value) return;
  emit('update:isOpen', false);
};

const handleSave = async () => {
  try {
    isSaving.value = true

    await enrollmentService.updateStudentCourses(
      props.student.id,
      Array.from(selectedIds.value)
    )

    alert('儲存完成！');
    emit('saved'); // 通知父組件重新整理學生列表
    closeModal(); // 關閉彈窗
  } finally {
    isSaving.value = false
  }
}
</script>
