<script setup>
import { ref, watch } from 'vue';
import SearchBar from '@/components/base/SearchBar.vue';
import StudentForm from '@/modules/student/StudentForm.vue';
import StudentEnrollmentModal from '@/modules/student/StudentEnrollmentModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import TableRenderer from '@/components/shared/TableRenderer.vue';
import Toolbar from '@/components/base/Toolbar.vue';
import { useTableSelection } from '@/composables/useTableSelection';
import { schemas } from '@/schemas'
import { useManager } from '@/composables/useManager'
import { useBatchActions } from '@/composables/useBatchActions'

const {
  list: students,
  dataFiltered: filteredStudents,
  errorFields,
  form,
  isOpen,
  isLoading,

  openCreate,
  openEdit,
  handleSave
} = useManager({
  type: 'students',
  schema: schemas.students,
  useSearch: true
})

const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(filteredStudents)

const { batchDelete } = useBatchActions('students', {
  selectedIds
})

const searchQuery = ref('')

const isEnrollmentModalOpen = ref(false);
const currentStudentForEnrollment = ref(null);

const openEnrollmentModal = (student) => {
  currentStudentForEnrollment.value = student;
  isEnrollmentModalOpen.value = true;
};

const handleRowClick = (item) => {
  openEdit(item)
}

watch(searchQuery, () => {
  if (selectedIds.value.length > 0) {
    clearSelection();
  }
})
</script>

<template>
  <div class="student-manager">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p
        style="
          margin-left: 10px;
          font-weight: bold;
          color: var(--btn-primary-text);
        "
      >
        學生資料同步中...
      </p>
    </div>

    <h2 class="page-title">學生資料設定</h2>

    <Toolbar
      :selectedCount="selectedIds.length"
      @add="openCreate"
      @batch-delete="batchDelete"
    >
      <template #search>
        <SearchBar v-model="searchQuery" />
        <div class="status-bar">
          <span class="text-small" v-if="searchQuery.trim() !== ''">
            🔍 找到 {{ filteredStudents.length }} 筆結果
          </span>
        </div>

      </template>
    </Toolbar>

    <TableRenderer
      :items="filteredStudents"
      :fields="schemas.students.fields"
      selectable
      :selectedIds="selectedIds"
      :isAllSelected="isAllSelected"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
      @row-click="handleRowClick"
      @edit="openEdit($event)"
    >
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
          icon="📚"
          text="設定課程"
          @click.stop="openEnrollmentModal(item)"
        />
      </template>
    </TableRenderer>

    <div
      v-if="!students || students.length === 0"
      style="padding: 40px; text-align: center; color: #999"
    >
      目前暫無學生資料，請點擊右上方新增。
    </div>

    <StudentForm
      :errorFields="errorFields"
      v-model="form"
      v-model:isOpen="isOpen"
      @save="handleSave"
    />

    <StudentEnrollmentModal
      v-model:isOpen="isEnrollmentModalOpen"
      :student="currentStudentForEnrollment"
      @close="isEnrollmentModalOpen = false"
    />
  </div>
</template>
