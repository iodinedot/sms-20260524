<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SearchBar from '@/components/base/SearchBar.vue';
import CourseForm from '@/components/forms/CourseForm.vue';
import CourseStudentsModal from '@/components/CourseStudentsModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import TableRenderer from '@/components/renderers/TableRenderer.vue';
import Toolbar from '@/components/base/Toolbar.vue';
import { useTableSelection } from '@/composables/useTableSelection';
import { useSettings } from '@/composables/useSettings'
import { useCrud } from '@/composables/useCrud'
import { schemas } from '@/schemas'
import { useSearch } from '@/composables/useSearch'

const { maps } = useSettings()

const searchQuery = ref('')

const { getName, getOptions } = useSettings()
const {
  list: courses,
  add,
  update,
  remove,
  createEmpty,
  subscribe
} = useCrud('courses')
const { filtered: filteredCourses } = useSearch({
  list: courses,
  query: searchQuery,
  maps
})

const campusCrud = useCrud('campuses')

onMounted(() => {
  subscribe()
  campusCrud.subscribe()
})

// --- UI 狀態控制 ---
const isCourseModalOpen = ref(false); // 控制彈窗開啟關閉
/*
// --- 搜尋與全選邏輯 (完全保留你原本的過濾程式碼，僅移除 category 欄位) ---
const filteredCourses = computed(() => {
  const data = courses.value || [];
  if (!searchQuery.value.trim()) return data;

  const keyword = searchQuery.value.toLowerCase();
  return data.filter((c) => {
    const teacherName = maps.value.teachers?.[String(c.teacherId)]?.toLowerCase() || '';
    const courseName = (c.name || '').toLowerCase();
    const courseDescription = (c.description || '').toLowerCase();

    return (
      courseName.includes(keyword) ||
      courseDescription.includes(keyword) ||
      teacherName.includes(keyword)
    );
  });
});*/

const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(filteredCourses)


// --- 2. 核心變數：當前準備送進彈窗進行「新增、修改、複製」的響應式種子 ---
const tempCourse = ref({});

const isStudentModalOpen = ref(false);
const currentCourseForStudents = ref(null);

const openStudentModal = (course) => {
  currentCourseForStudents.value = course;
  isStudentModalOpen.value = true;
};

// --- 方法：開啟彈窗 ---
// --- 3. 開啟彈窗的單一管線管理 (取代舊 openModal) ---
// studentManager: openAddModal(修改是在展開頁面)
const courseModalMode = ref('') // add | edit | copy
const openCourseModal = (mode, course = null) => {
  courseModalMode.value = mode;
  if (mode === 'add') {
    tempCourse.value = createEmpty();
  } else if (mode === 'edit') {
    tempCourse.value = JSON.parse(JSON.stringify(course));
  } else if (mode === 'copy') {
    tempCourse.value = {
      ...JSON.parse(JSON.stringify(course)),
      id: null,
      name: course.name ? `${course.name} (複本)` : '(複本)',
    };
  }
  isCourseModalOpen.value = true;
};

// --- 方法：儲存變更 ---
const handleSaveCourse = async (course) => {
  try {
    const raw = course

    // ✅ schema 過濾（超重要）
    const payload = {}
    Object.keys(schemas.courses.fields).forEach(key => {
      const value = raw[key]

      if (value !== undefined) {
        payload[key] = value
      }
    })

    // ✅ 判斷 add / edit
    if (raw.id) {
      await update({
        id: raw.id,
        ...payload
      })
    } else {
      await add(payload)
    }

    isCourseModalOpen.value = false
  } catch (err) {
    console.log("saveCourse error: ", err)
    alert('儲存失敗')
  }
}

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

const handleRowClick = (item) => {
  openCourseModal('edit', item)
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

onMounted(() => {
  subscribe()
})

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
      @add="openCourseModal('add')"
      @batch-delete="handleBatchDelete"
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
      @edit="openCourseModal('edit', $event)"
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
          @click.stop="openCourseModal('edit', item)"
        />

        <BaseButton
          responsive
          variant="outline"
          icon="📄"
          text="複製"
          @click.stop="openCourseModal('copy', item)"
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
      v-model="tempCourse"
      v-model:isOpen="isCourseModalOpen"
      @save="handleSaveCourse"
    />

    <CourseStudentsModal
      v-if="isStudentModalOpen"
      v-model:isOpen="isStudentModalOpen"
      :course="currentCourseForStudents"
      @close="isStudentModalOpen = false"
    />
  </div>
</template>
