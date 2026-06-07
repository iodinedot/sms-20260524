<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SearchBar from '@/components/base/SearchBar.vue';
import CourseForm from '@/components/forms/CourseForm.vue';
import CourseEnrollmentModal from '@/components/forms/CourseEnrollmentModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import TableRenderer from '@/components/renderers/TableRenderer.vue';
import Toolbar from '@/components/base/Toolbar.vue';
import { useTableSelection } from '@/composables/useTableSelection';
import { useSettings } from '@/composables/useSettings'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'
import { useSearch } from '@/composables/useSearch'
import { useManager } from '@/composables/useManager'
import { useBatchActions } from '@/composables/useBatchActions'

const { maps } = useSettings()
const { getName, getOptions } = useSettings()

const searchQuery = ref('')
const campusCrud = useCrud('campuses')

const {
  list: courses,
  filtered: filteredCourses,
  form,
  isOpen,
  isEditing,

  openCreate,
  openEdit,
  handleSave
} = useManager({
  type: 'courses',
  schema: schemas.courses,
  useSearch: true
})

const { batchDelete } = useBatchActions('courses')

onMounted(() => {
  campusCrud.subscribe()
})

const fieldErrors = ref({})
const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(filteredCourses)

const isStudentModalOpen = ref(false);
const currentCourseForStudents = ref(null);

const openEnrollmentModal = (course) => {
  currentCourseForStudents.value = course;
  isStudentModalOpen.value = true;
};

/*
// --- 6. 刪除與獲取資料 ---
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return;
  if (
    !confirm(
      `確定要刪除這 ${selectedIds.value.length} 門課程嗎？\n(提示：系統會保留歷史紀錄，但新學生無法再選修)`
    )
  ) {
    return;
  }
  try {
    await Promise.all(
      selectedIds.value.map((id) => remove(id))
    );
    clearSelection();
    alert('課程已成功移除！');
  } catch (error) {
    alert('刪除過程發生錯誤');
  }
};
*/

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
  if (item.startDate && item.endDate && item.billingType === 'fixed-period') {
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
          @click="openEnrollmentModal(item)"
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
      v-if="isStudentModalOpen"
      v-model:isOpen="isStudentModalOpen"
      :course="currentCourseForStudents"
      @close="isStudentModalOpen = false"
    />
  </div>
</template>
