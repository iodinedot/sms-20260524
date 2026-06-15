<script setup>
import { ref, watch } from 'vue';
import SearchBar from '@/components/base/SearchBar.vue';
import CourseForm from '@/modules/course/CourseForm.vue';
import CourseEnrollmentModal from '@/modules/course/CourseEnrollmentModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import TableRenderer from '@/components/shared/TableRenderer.vue';
import Toolbar from '@/components/base/Toolbar.vue';
import { useTableSelection } from '@/composables/useTableSelection';
import { schemas } from '@/schemas'
import { useManager } from '@/composables/useManager'
import { useBatchActions } from '@/composables/useBatchActions'

// course
const {
  list: courses,
  dataFiltered: filteredCourses,
  form,
  isOpen,
  isLoading,
  isEditing,

  openCreate,
  openEdit,
  handleSave
} = useManager({
  type: 'courses',
  schema: schemas.courses,
  useSearch: true
})

const fieldErrors = ref({})
const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(filteredCourses)

const { batchDelete } = useBatchActions('courses', {
  selectedIds
})


const searchQuery = ref('')

const isEnrollmentModalOpen = ref(false);
const currentCourseForEnrollment = ref(null);

const openEnrollmentModal = (course) => {
  currentCourseForEnrollment.value = course;
  isEnrollmentModalOpen.value = true;
};

const handleRowClick = (item) => {
  openEdit(item)
}

const getScheduleDisplay = (item) => {
  const schedules = item.schedules
  // 🟢 weekly
  if (schedules && schedules.length > 0) {
    return [
      `每週 ${schedules.length} 堂`,
      ...schedules.map(s =>
        `週${['日','一','二','三','四','五','六'][s.dayOfWeek]} ${s.startTime}~${s.endTime}`
      )
    ]
  }

  // 🔵 period
  if (item.startDate && item.endDate && item.billingType === 'period-total') {
    return [
      '期間上課',
      `${item.startDate} ～ ${item.endDate}`
    ]
  }

  // ⚪ empty
  return ['未設定']
}

const copyCourse = (course) => {
  const copied = { ...course }
  delete copied.id

  form.value = copied
  isEditing.value = false
  fieldErrors.value = {}
  isOpen.value = true
}

watch(searchQuery, () => {
  if (selectedIds.value.length > 0) {
    clearSelection();
  }
})
</script>

<template>
  <div class="course-manager">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p
        style="
          margin-left: 10px;
          font-weight: bold;
          color: var(--btn-primary-text);
        "
      >
        課程資料同步中...
      </p>
    </div>

    <h2 class="page-title">課程資料設定</h2>

    <Toolbar
      :selectedCount="selectedIds.length"
      @add="openCreate"
      @batch-delete="batchDelete"
    >
      <template #search>
        <SearchBar v-model="searchQuery" />
        <div class="status-bar">
          <span class="text-small" v-if="searchQuery.trim() !== ''">
            🔍 找到 {{ filteredCourses.length }} 筆結果
          </span>
        </div>

      </template>
    </Toolbar>

    <TableRenderer
      :items="filteredCourses"
      :fields="schemas.courses.fields"
      selectable
      :selectedIds="selectedIds"
      :isAllSelected="isAllSelected"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
      @row-click="handleRowClick"
      @edit="openEdit($event)"
    >
      <template #schedules="{ item }">
        <div v-for="(line, i) in getScheduleDisplay(item)" :key="i">
          {{ line }}
        </div>
      </template>
      <template #actions="{ item }">
        <BaseButton
          responsive
          variant="outline"
          icon="✏️"
          text="編輯"
          @click.stop="openEdit(item)"
        />
        <BaseButton
          responsive
          variant="outline"
          icon="👦🏻"
          text="設定學生"
          @click.stop="openEnrollmentModal(item)"
        />

        <BaseButton
          responsive
          variant="outline"
          icon="📄"
          text="複製"
          @click.stop="copyCourse(item)"
        />
      </template>
    </TableRenderer>
 
    <div
      v-if="!courses || courses.length === 0"
      style="padding: 40px; text-align: center; color: #999"
    >
      目前暫無課程資料，請點擊右上方新增。
    </div>
    <CourseForm
      :errors="fieldErrors"
      v-model="form"
      v-model:isOpen="isOpen"
      @save="handleSave"
    />

    <CourseEnrollmentModal
      v-model:isOpen="isEnrollmentModalOpen"
      :course="currentCourseForEnrollment"
      @close="isEnrollmentModalOpen = false"
    />
  </div>
</template>
