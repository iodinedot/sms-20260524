<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { courseService } from '../services/courseService';
import { useTableSelection } from '../composables/useTableSelection';
import { useCrud } from '../composables/useCrud'
import { useSettings } from '../composables/useSettings'
import SearchBar from '../components/SearchBar.vue';
import BaseButton from '../components/BaseButton.vue';
import CourseFormModal from '../components/CourseFormModal.vue';
import CourseStudentsModal from '../components/CourseStudentsModal.vue';

// --- UI 狀態控制 ---
const isLoading = ref(true);
const localCourses = ref([]);
const isCourseModalOpen = ref(false); // 控制彈窗開啟關閉
const searchQuery = ref('');

//const { list, load, add, update, remove } = useCrud('courses')
const { getName, getOptions } = useSettings()
// --- 2. 核心變數：當前準備送進彈窗進行「新增、修改、複製」的響應式種子 ---
const currentTempCourse = ref({});

//直接向服務層索取標準的空白模型
const getEmptyCourse = () => {
  return courseService.getEmptyCourse();
};

const isStudentModalOpen = ref(false);
const currentCourseForStudents = ref(null);

const openStudentModal = (course) => {
  currentCourseForStudents.value = course;
  isStudentModalOpen.value = true;
};

// --- 方法：開啟彈窗 ---
// --- 3. 開啟彈窗的單一管線管理 (取代舊 openModal) ---
const openCourseModal = (mode, course = null) => {
  if (mode === 'add') {
    currentTempCourse.value = getEmptyCourse();
  } else if (mode === 'edit') {
    currentTempCourse.value = JSON.parse(JSON.stringify(course));
  } else if (mode === 'copy') {
    currentTempCourse.value = {
      ...JSON.parse(JSON.stringify(course)),
      id: null,
      name: course.name ? `${course.name} (複本)` : '(複本)',
    };
  }
  isCourseModalOpen.value = true;
};

// --- 方法：儲存變更 ---
// --- 4. 儲存變更：接收來自子組件提交的乾淨 Payload ---
const handleSaveCourse = async (coursePayload) => {
  try {
    // 執行 Firebase 寫入
    await courseService.saveCourse(coursePayload);
    // 成功後關閉 Modal 並刷新本地數據清單
    isCourseModalOpen.value = false;
    await refreshData();
  } catch (error) {
    alert('儲存失敗，請檢查網路連線');
  }
};

// --- 5. 搜尋與全選邏輯 (完全保留你原本的過濾程式碼，僅移除 category 欄位) ---
const filteredCourses = computed(() => {
  const data = localCourses.value || [];
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
});

// 🎯 完美重構：直接複用多選邏輯，自動生成全選與切換函式，並對齊 filteredCourses
const { selectedIds, isAllSelected, toggleSelectAll, clearSelection } =
  useTableSelection(filteredCourses);

// --- 6. 刪除與獲取資料 ---
const deleteSelected = async () => {
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
      selectedIds.value.map((id) => courseService.deleteCourse(id))
    );

    alert('課程已成功移除！');
    clearSelection();
    await refreshData();
  } catch (error) {
    alert('刪除過程發生錯誤');
  }
};

const refreshData = async () => {
  isLoading.value = true;
  try {
    const coursesData = await courseService.getCourses();
    localCourses.value = coursesData || [];
  } catch (error) {
    console.error('資料載入失敗:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await refreshData()
})

watch(searchQuery, () => {
  if (selectedIds.value.length > 0) {
    clearSelection();
  }
});
</script>

<template>
  <div class="course-manager">
    <h2 class="page-title">課程資料設定</h2>

    <div class="manager-toolbar">
      <div class="toolbar-search">
        <SearchBar v-model="searchQuery" placeholder="搜尋課程名稱、老師..." />
        <BaseButton
          responsive
          variant="danger"
          icon="🗑"
          text="刪除選取"
          :disabled="selectedIds.length === 0"
          @click="deleteSelected"
        />
        <BaseButton
          responsive
          variant="primary"
          icon="＋"
          text="新增課程種類"
          title="新增課程種類"
          @click="openCourseModal('add')"
        />
      </div>
    </div>
    <div class="status-bar">
      <span class="text-small" v-if="searchQuery.trim() !== ''">
        🔍 找到 {{ filteredCourses.length }} 筆結果
      </span>
      <span v-if="selectedIds.length > 0" class="text-small">
        已選取 <strong>{{ selectedIds.length }}</strong> 項
      </span>
    </div>

    <table class="table-card">
      <thead>
        <tr>
          <th style="width: 40px">
            <input
              type="checkbox"
              :disabled="filteredCourses.length === 0"
              :checked="isAllSelected"
              @change="toggleSelectAll"
            />
          </th>
          <th>校區</th>
          <th>課程名稱</th>
          <th>授課教師</th>
          <th>上課時間</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="c in filteredCourses" :key="c.id">
          <tr :class="{ 'row-selected': selectedIds.includes(c.id) }">
            <td>
              <input type="checkbox" :value="c.id" v-model="selectedIds" />
            </td>
            <td>{{ getName('campuses', c.campusId) }}</td>
            <td>{{ c.name }}</td>
            <td>{{ getName('teachers', c.teacherId) }}</td>
            <td>
              <div v-if="c.billingType === 'fixed-weekly'">
                <span class="text-small"
                  >每週 {{ c.schedules?.length || 0 }} 堂</span
                >
                <div
                  v-if="c.schedules && c.schedules.length > 0"
                  style="margin-top: 4px"
                >
                  <span
                    v-for="(sch, i) in c.schedules"
                    :key="i"
                    class="text-small"
                    style="display: block; color: var(--text-secondary)"
                  >
                    週{{
                      ['日', '一', '二', '三', '四', '五', '六'][sch.dayOfWeek]
                    }}
                    {{ sch.startTime }}~{{ sch.endTime }}
                  </span>
                </div>
              </div>
              <div v-else-if="c.billingType === 'fixed-period'">
                <span class="text-small" style="color: var(--text-secondary)">
                  {{ c.startDate }} ~ {{ c.endDate }}
                </span>
              </div>
            </td>
            <td>
              <div class="op-group">
                <BaseButton
                  responsive
                  variant="outline"
                  icon="✏️"
                  text="修改資料"
                  title="修改資料"
                  @click="openCourseModal('edit', c)"
                />
                <BaseButton
                  responsive
                  variant="outline"
                  icon="👥"
                  text="學員管理"
                  title="學員管理"
                  @click="openStudentModal(c)"
                />
                <BaseButton
                  responsive
                  variant="outline"
                  icon="📑"
                  text="複製"
                  title="複製"
                  @click="openCourseModal('copy', c)"
                />
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <div
      v-if="!localCourses || localCourses.length === 0"
      style="padding: 40px; text-align: center; color: #999"
    >
      目前暫無課程資料，請點擊右上方新增。
    </div>

    <CourseFormModal
      v-model:isOpen="isCourseModalOpen"
      :modelValue="currentTempCourse"
      @save="handleSaveCourse"
    />
    <CourseStudentsModal
      v-if="isStudentModalOpen"
      v-model:isOpen="isStudentModalOpen"
      :course="currentCourseForStudents"
      @close="isStudentModalOpen = false"
      @success="refreshData"
    />
  </div>
</template>
