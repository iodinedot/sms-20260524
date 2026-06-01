<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import StudentForm from '../components/StudentForm.vue';
import StudentCourseModal from '../components/StudentCourseModal.vue';
import BaseButton from '../components/BaseButton.vue';
import { enrollmentService } from '../services/enrollmentService.js';
import { useTableSelection } from '../composables/useTableSelection';
import { useSettings } from '../composables/useSettings';
import { useCrud } from '../composables/useCrud';

const { getName, getOptions } = useSettings()
const {
  list: students,
  add,
  update,
  remove,
  createEmpty,
  subscribe
} = useCrud('students')

const campusCrud = useCrud('campuses')

onMounted(() => {
  subscribe()
  campusCrud.subscribe()
})

const emit = defineEmits(['switch-tab']);

// 接收父元件傳下來的當前啟用頁籤名稱
const props = defineProps({
  activeTab: {
    type: String,
    default: '',
  },
});
// --- UI 狀態 ---
const isModalOpen = ref(false);
const modalTitle = ref('新增學生');
const searchQuery = ref('');
const selectedCampus = ref('所有校區'); // 預設顯示全部

// 學生搜尋過濾邏輯
const filteredStudents = computed(() => {
  let data = students.value || [];

  // 校區過濾 (搭配我們先前翻新的 campusId)
  if (selectedCampus.value !== '所有校區') {
    data = data.filter((s) => s.campusId === selectedCampus.value);
  }

  // 關鍵字搜尋
  if (!searchQuery.value.trim()) return data;
  const keyword = searchQuery.value.toLowerCase();
  return data.filter(
    (s) =>
      (s.chName || '').toLowerCase().includes(keyword) ||
      (s.enName || '').toLowerCase().includes(keyword) ||
      (s.parentPhone || '').toLowerCase().includes(keyword)
  );
});

// 直接複用多選邏輯，並對齊 HTML 範本原本使用的名稱與函式
const { selectedIds, isAllSelected, toggleSelectAll, clearSelection } =
  useTableSelection(filteredStudents);

// 1. 接管真理來源：宣告本地學生名單，完全脫離外部 Props 控制
const systemCourses = ref([]);
const isLoading = ref(false);

// --- 2. 核心變數：當前準備送進表單進行「新增或修改」的響應式種子 ---
const tempStudent = ref(createEmpty());

// 3. 展開列核心狀態控管
const expandedStudentId = ref(null); // 目前展開的是哪一個學生 ID
const editModeId = ref(null); // 目前哪一個學生處於「可編輯狀態」

// 5. 控制展開與收合 (獨立出來的收合功能)
const toggleExpand = (studentId) => {
  if (expandedStudentId.value === studentId) {
    // 如果點擊的是同一個人，就單純「收合」，並關閉編輯狀態
    expandedStudentId.value = null;
    editModeId.value = null;
    tempStudent.value = createEmpty();
  } else {
    // 點擊新的人，展開他，並預設先維持「唯讀查看狀態」
    expandedStudentId.value = studentId;
    editModeId.value = null;
    const target = students.value.find(
      (student) => student.id === studentId
    );
    if (target) {
      // 💡 將真實資料深拷貝灌進 tempStudent，這樣 StudentForm 一展開就能立刻填上正確數據
      tempStudent.value = JSON.parse(JSON.stringify(target));
    }
  }
};

// 6. 處理展開列的「修改 / 儲存」按鈕點擊事件 (核心行為修正：儲存後不收回)
const handleRowActionClick = async (student) => {
  if (editModeId.value === student.id) {
    try {
      isLoading.value = true;
      console.log("tempStudent:", tempStudent)
      await update(tempStudent.value)
      
      editModeId.value = null;
      alert('資料儲存成功！');
    } catch (error) {
      alert('儲存失敗，請檢查網路');
    } finally {
      isLoading.value = false;
    }
  } else {
    // 【修改情境】：如果目前是唯讀，點擊代表要「開啟編輯」
    editModeId.value = student.id;
    // 將該學生的資料深拷貝一份，灌進負責與表單雙向綁定的 tempStudent 變數中
    tempStudent.value = JSON.parse(JSON.stringify(student));
  }
};

// 7. 彈窗群組：確認新增學生
const saveStudent = async () => {
  const name = tempStudent.value.chName.trim();
  if (!name) {
    alert('請輸入學生中文姓名');
    return;
  }

  try {
    isLoading.value = true;
    // 送出新增
    await add(tempStudent.value)
    isModalOpen.value = false; // 關閉彈窗
  } catch (error) {
    alert('新增失敗', error);
  } finally {
    isLoading.value = false;
  }
};

// 8. 多選批次刪除
const deleteSelected = async () => {
  if (selectedIds.value.length === 0) return;
  if (
    !confirm(
      `確定要刪除這 ${selectedIds.value.length} 位學生嗎？資料將無法恢復。`
    )
  )
    return;

  try {
    isLoading.value = true;
    // 利用 Promise.all 並行將所有勾選的 ID 送去 Firebase 刪除
    await Promise.all(
      selectedIds.value.map((id) => remove(id))
    );

    clearSelection();
    alert('刪除成功');
  } catch (error) {
    console.error('批次刪除失敗:', error);
    alert('部分學生刪除失敗');
  } finally {
    isLoading.value = false;
  }
};

// 9. 開啟新增彈窗的防呆重置
const openAddModal = () => {
  modalTitle.value = '新增學生資料';
  tempStudent.value = createEmpty();
  isModalOpen.value = true;
};

// 查看繳費單的方法 (切換至帳單頁面)
const viewBills = (event, studentId) => {
  event.stopPropagation();
  // 這裡可以實作過濾帳單並切換分頁的邏輯
  emit('switch-tab', 'billing');
};

// 控制選課彈窗的 UI 狀態
const isCourseModalOpen = ref(false);
const currentSelectedStudent = ref(null);

// 開啟選課彈窗的管線
const openCourseSelection = (student) => {
  currentSelectedStudent.value = student;
  isCourseModalOpen.value = true;
};

// 💰 控制「產生繳費單」確認視窗的開啟狀態
const isGenerateBillModalOpen = ref(false);

const enrollmentMap = ref({})

const loadEnrollmentCounts = async () => {
  const ids = students.value.map(s => String(s.id))

  enrollmentMap.value =
    await enrollmentService.getStudentCourseCountMap(ids)
}

const handleEnrollmentSaved = async () => {
  await loadEnrollmentCounts()
}

// 防呆監聽：當搜尋字串或校區篩選變動時，自動清空打勾勾狀態
watch([searchQuery, selectedCampus], () => {
  if (selectedIds.value.length > 0) {
    clearSelection();
  }
});

watch(
  () => props.activeTab,
  async (newTab) => {
    if (newTab === 'students') {
      await loadEnrollmentCounts()
    }
  }
);
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

    <div class="manager-toolbar">
      <div class="toolbar-search">
        <SearchBar
          v-model="searchQuery"
          placeholder="搜尋中文名、英文名、電話..."
        />

        <select v-model="selectedCampus" class="base-select width-auto">
          <option value="所有校區">所有校區</option>
          <option v-for="opt in getOptions({ optionsKey: 'campuses' })" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
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
          text="新增學生"
          title="新增學生資料"
          @click="openAddModal"
        />
      </div>

      <div class="status-bar">
        <span class="text-small" v-if="searchQuery.trim() !== ''">
          🔍 找到 {{ filteredStudents.length }} 筆結果
        </span>
        <span v-if="selectedIds.length > 0" class="text-small">
          已選取 <strong>{{ selectedIds.length }}</strong> 項
        </span>
      </div>
    </div>

    <table class="table-card">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              :disabled="filteredStudents.length === 0"
              :checked="isAllSelected"
              @change="toggleSelectAll"
            />
          </th>
          <th>校區</th>
          <th>姓名 (中/英)</th>
          <th>性別</th>
          <th>年級 / 家長電話</th>
          <th>已選修課程數</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="s in filteredStudents" :key="s.id">
          <tr
            :class="{
              'row-selected': selectedIds.includes(s.id),
              'row-expanded': expandedStudentId === s.id,
            }"
          >
            <td>
              <input type="checkbox" :value="s.id" v-model="selectedIds" />
            </td>
            <td>{{ getName('campuses', s.campusId)}}</td>
            <td>
              <div>{{ s.chName }}</div>
              <div class="text-small" style="color: var(--text-secondary)">
                {{ s.enName }}
              </div>
            </td>
            <td>
              <span v-if="s.gender === 'M'">男</span>
              <span v-else-if="s.gender === 'F'">女</span>
              <span v-else>{{ s.gender || '---' }}</span>
            </td>
            <td>
              <div>{{ s.grade || '未填寫' }}</div>
              <div class="text-small" style="color: var(--text-secondary)">
                📱 {{ s.parentPhone }}
              </div>
            </td>
            <td>
              <span
                class="text-small badge-grey"
                style="cursor: pointer; user-select: none"
                title="點擊調整此學生的選課"
                @click="openCourseSelection(s)"
              >
                {{ enrollmentMap[s.id] || 0 }} 門課程 ⚙️
              </span>
            </td>
            <td>
              <BaseButton
                responsive
                variant="outline"
                :icon="expandedStudentId === s.id ? '▲' : '▼'"
                :text="expandedStudentId === s.id ? '收合明細' : '展開編輯'"
                @click="toggleExpand(s.id)"
              />
            </td>
          </tr>

          <tr v-if="expandedStudentId === s.id" class="expand-row">
            <td colspan="7">
              <div class="student-form-container">
                <StudentForm
                  v-model="tempStudent"
                  :isReadOnly="editModeId !== s.id"
                />
                <div
                  class="toolbar"
                  style="
                    margin-top: 20px;
                    margin-bottom: 0;
                    justify-content: space-between;
                  "
                >
                  <BaseButton variant="outline"
                    text="▲ 收合此列"
                    @click="toggleExpand(s.id)"
                  />
                  <div style="display: flex; gap: 12px; align-items: center">
                    <span
                      v-if="editModeId === s.id"
                      class="text-small"
                      style="color: var(--btn-success-text); font-weight: bold"
                    >
                      ✍️ 編輯中，完成後請點擊儲存變更
                    </span>

                    <BaseButton
                      :text="editModeId === s.id ? '完成' : '編輯'"
                      :variant="editModeId === s.id ? 'success' : 'outline'"
                      @click="handleRowActionClick(s)"
                    />
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <div
      v-if="!students || students.length === 0"
      style="padding: 40px; text-align: center; color: #999"
    >
      目前暫無學生資料，請點擊右上方新增。
    </div>

    <div
      v-if="isModalOpen"
      class="modal-overlay"
      @click.self="isModalOpen = false"
    >
      <div class="modal-content">
        <div class="manager-toolbar">
          <h3 class="page-title" style="margin: 0; flex: 1">
            {{ modalTitle }}
          </h3>
          <BaseButton
            responsive
            variant="outline"
            icon="×"
            text=""
            @click="isModalOpen = false"
            class="close-x"
          />
        </div>
        <div class="modal-body">
          <StudentForm
            v-model="tempStudent" 
            :isReadOnly="false" />
        </div>
      </div>
    </div>

    <StudentCourseModal
      v-model:isOpen="isCourseModalOpen"
      :student="currentSelectedStudent"
      @saved="handleEnrollmentSaved"
    />
  </div>
</template>
