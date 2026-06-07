<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SearchBar from '@/components/base/SearchBar.vue';
import StudentForm from '@/components/forms/StudentForm.vue';
import StudentCourseModal from '@/components/StudentCourseModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import TableRenderer from '@/components/renderers/TableRenderer.vue';
import { enrollmentService } from '@/services/enrollmentService.js';
import { useTableSelection } from '@/composables/useTableSelection';
import { useSettings } from '@/composables/useSettings';
import { useCrud } from '@/composables/useCrud';
import { schemas } from '@/schemas'

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
const isStudentModalOpen = ref(false);
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
const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(filteredStudents);

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

const studentModalMode = ref('') // add | edit | copy
const openStudentModal = (mode, student = null) => {
  studentModalMode.value = mode;
  if (mode === 'add') {
    tempStudent.value = createEmpty();
  } else if (mode === 'edit') {
    tempStudent.value = JSON.parse(JSON.stringify(student));
  } else if (mode === 'copy') {  // 暫時沒支援
    tempStudent.value = {
      ...JSON.parse(JSON.stringify(student)),
      id: null,
      name: student.name ? `${student.name} (複本)` : '(複本)',
    };
  }
  isStudentModalOpen.value = true;
};

// 7. 彈窗群組：確認新增學生
const handleSaveStudent = async (student) => {
  try {
    const raw = student

    // ✅ schema 過濾（超重要）
    const payload = {}
    Object.keys(schemas.students.fields).forEach(key => {
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

    isStudentModalOpen.value = false
  } catch (err) {
    console.log("saveStudent error: ", err)
    alert('儲存失敗')
  }
}

// 8. 多選批次刪除
const handleBatchDelete = async () => {
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

const handleRowClick = (item) => {
  openStudentModal('edit', item)
}

// 9. 開啟新增彈窗的防呆重置
const openAddModal = () => {
  modalTitle.value = '新增學生資料';
  tempStudent.value = createEmpty();
  isStudentModalOpen.value = true;
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
          @click="handleBatchDelete"
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

    <TableRenderer
      :items="filteredStudents"
      :fields="schemas.students.fields"
      selectable
      :selectedIds="selectedIds"
      :isAllSelected="isAllSelected"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll($event)"
      @row-click="handleRowClick"
      @edit="openStudentModal('edit', $event)"
      @batch-delete="handleBatchDelete"
    />

    <div
      v-if="!students || students.length === 0"
      style="padding: 40px; text-align: center; color: #999"
    >
      目前暫無學生資料，請點擊右上方新增。
    </div>

    <div
      v-if="isStudentModalOpen"
      class="modal-overlay"
      @click.self="isStudentModalOpen = false"
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
            @click="isStudentModalOpen = false"
            class="close-x"
          />
        </div>
        
        <div class="modal-body">
          <StudentForm
            :errors="fieldErrors"
            v-model="tempStudent"
            v-model:isOpen="isStudentModalOpen"
            @save="handleSaveStudent"
          />
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
