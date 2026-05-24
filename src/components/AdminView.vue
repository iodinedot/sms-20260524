<template>
  <div class="admin-view-container">
    <h2 class="page-title">行政管理設定</h2>

    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>資料讀取中，請稍候...</p>
    </div>

    <div v-else class="admin-content">
      <div class="accordion-card" :class="{ 'is-active': activeSection === 'feeItems' }">
        <div class="accordion-header" @click="toggleSection('feeItems')">
          <div class="accordion-title-group">
            <h4>⚙️ 繳費項目管理</h4>
            <span class="badge-hint" v-if="settings.feeItems.length">
              ({{ settings.feeItems.length }} 項)
            </span>
          </div>
          <span class="accordion-arrow">▼</span>
        </div>

        <div class="accordion-content" v-show="activeSection === 'feeItems'">
          <FeeItemManager 
            :items="settings.feeItems" 
            @update:items="handleUpdateSettings('feeItems', $event)"
          />
        </div>
      </div>
      <div class="accordion-card" :class="{ 'is-active': activeSection === 'teachers' }">
        <div class="accordion-header" @click="toggleSection('teachers')">
          <div class="accordion-title-group">
            <h4>👨‍🏫 授課老師管理</h4>
            <span class="badge-hint" v-if="settings.teachers.length">
              ({{ settings.teachers.length }} 位)
            </span>
          </div>
          <span class="accordion-arrow">▼</span>
        </div>

        <div class="accordion-content" v-show="activeSection === 'teachers'">
          <TeacherManager 
            :items="settings.teachers" 
            @update:items="handleUpdateSettings('teachers', $event)"
          />
        </div>
      </div>
      <section class="ui-card" style="margin-top: 20px">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h3>校區管理</h3>
          <button @click="toggleCampusEdit" :class="['btn', isCampusEditing ? 'btn-success' : 'btn-outline']" :disabled="isLoading" style="padding: 4px 12px; font-size: 0.9em">
            {{ isCampusEditing ? '💾 儲存並關閉' : '✎ 修改資訊' }}
          </button>
        </div>
        <div class="card-body">
          <div v-if="isCampusEditing" class="op-group" style="margin-bottom: 20px; display: flex; gap: 8px">
            <input v-model="newCampusName" class="base-input" style="flex: 1" placeholder="例如：台北校區、台中校區" />
            <button @click="addCampus" class="btn btn-primary" :disabled="!newCampusName.trim()">新增</button>
          </div>
          <div class="item-list">
            <div v-if="!settings.campuses?.length" class="empty-hint">目前尚無設定任何校區。</div>
            <div v-for="(campus, index) in settings.campuses" :key="campus.id || index" class="admin-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--border-color);">
              <span class="item-name">{{ campus.name }}</span>
              <button v-if="isCampusEditing" @click="deleteItem('campuses', index)" class="btn-remove" style="background: none; border: none; cursor: pointer;">🗑️</button>
            </div>
          </div>
        </div>
      </section>

      <section class="ui-card" style="margin-top: 20px">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h3>行政人員設定</h3>
          <button @click="toggleStaffEdit" :class="['btn', isStaffEditing ? 'btn-success' : 'btn-outline']" :disabled="isLoading" style="padding: 4px 12px; font-size: 0.9em">
            {{ isStaffEditing ? '💾 儲存並關閉' : '✎ 修改資訊' }}
          </button>
        </div>
        <div class="card-body">
          <div v-if="isStaffEditing" class="op-group" style="margin-bottom: 20px; display: flex; gap: 8px">
            <input v-model="newStaffName" class="base-input" style="flex: 1" placeholder="請輸入行政人員姓名" />
            <button @click="addStaff" class="btn btn-primary" :disabled="!newStaffName.trim()">新增</button>
          </div>
          <div class="item-list">
            <div v-if="!settings.staffs?.length" class="empty-hint">目前尚無設定任何行政人員。</div>
            <div v-for="(staff, index) in settings.staffs" :key="staff.id || index" class="admin-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--border-color);">
              <span class="item-name">{{ staff.name }}</span>
              <button v-if="isStaffEditing" @click="deleteItem('staffs', index)" class="btn-remove" style="background: none; border: none; cursor: pointer;">🗑️</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminService } from '../services/adminService.js';
// 引入行政管理子元件
import FeeItemManager from '../components/FeeItemManager.vue';
import TeacherManager from '../components/TeacherManager.vue';

// --- 響應式變數 ---
const isLoading = ref(true); // 新增載入狀態控管
const isSaving = ref(false);
// ✨ 調整後：只保留目前系統實質運作的老師清單與繳費項目 ✨
const settings = ref({
  teachers: [],
  feeItems: [],
  campuses: [],  // 補上校區陣列
  staffs: []     // 補上行政人員陣列
});

// 2. 🎯 手風琴面板控制狀態
// 'feeItems' 代表展開繳費項目，'teachers' 代表展開老師，'' 代表全數收合
const activeSection = ref('feeItems');

// 3. 🎯 手風琴切換函式：點擊已展開的面板就收合，點擊其他就切換
const toggleSection = (sectionName) => {
  activeSection.value = activeSection.value === sectionName ? '' : sectionName;
};

// 4. 🎯 核心資料同步中樞：當子元件內容有任何增刪，都會由這個函式統一接應並同步回 Firebase
const handleUpdateSettings = async (key, updatedArray) => {
  isSaving.value = true;
  try {
    // 遵循單向資料流原則，由父元件覆寫對應的資料
    settings.value = {
      ...settings.value,
      [key]: updatedArray
    };
    // 即時同步發動儲存回 Firebase，省去手動點擊「儲存並關閉」的冗餘步驟
    await adminService.updateSettings(settings.value); 
  } catch (error) {
    console.error('儲存行政設定失敗:', error);
    alert('資料庫同步失敗，請重新整理頁面試試看。');
  } finally {
    isSaving.value = false;
  }
};

const isFeeItemEditing = ref(false);
const newFeeItem = ref({ name: '', defaultAmount: 0 });

// 從 Firebase 撈取全局行政設定
const refreshData = async () => {
  isLoading.value = true;
  try {
    const data = await adminService.getSettings();
    if (data) {
      // 安全防禦：確保撈回來的物件必定有這兩個陣列，避免 runtime 可選串鏈報錯
      settings.value = {
        feeItems: data.feeItems || [],
        teachers: data.teachers || [],
        campuses: data.campuses || [],  // 👈 補上這行，別讓它變 undefined
        staffs: data.staffs || []       // 👈 補上這行，別讓它變 undefined
      };
    }
  } catch (error) {
    console.error('讀取行政設定失敗:', error);
  } finally {
    isLoading.value = false;
  }
};

// 儲存資料：將整個 settings 物件同步至 Firebase
const save = async () => {
  try {
    await adminService.saveSettings(settings.value);
    console.log('儲存成功');
  } catch (error) {
    console.error('儲存失敗：', error);
    alert('儲存失敗，請稍後再試');
  }
};

// 刪除項目
const deleteItem = async (key, index) => {
  if (confirm('確定要刪除此項目嗎？')) {
    settings.value[key].splice(index, 1);
    await save(); // 確保資料庫同步
  }
};

// 修改按鈕切換
const toggleFeeItemEdit = async () => {
  if (isFeeItemEditing.value) {
    await save(); // 結束編輯時，確保資料存回 Firebase
  }
  isFeeItemEditing.value = !isFeeItemEditing.value;
};

// 新增繳費項目
const addFee = async () => {
  const name = newFeeItem.value.name.trim();
  if (!name) return;

  settings.value.feeItems.push({
    name: name,
    defaultAmount: Number(newFeeItem.value.defaultAmount) || 0,
  });

  await save();
  newFeeItem.value = { name: '', defaultAmount: 0 }; // 重置輸入
};

// --- 生命週期 ---
onMounted(() => {
  refreshData();
});

// ====== 💡 步驟 3：新增老師管理相關狀態與邏輯 ======

// 控制老師卡片是否處於編輯狀態
const isTeacherEditing = ref(false);

// 暫存新輸入的老師姓名
const newTeacherName = ref('');

// 切換老師編輯按鈕
const toggleTeacherEdit = async () => {
  if (isTeacherEditing.value) {
    await save(); // 結束編輯時，確保將整包變更存回 Firebase
  }
  isTeacherEditing.value = !isTeacherEditing.value;
};

// 新增老師 (確保產生帶有唯一 id 的物件結構)
const addTeacher = async () => {
  const name = newTeacherName.value.trim();
  if (!name) return;

  // 防呆：建立安全的物件結構，包含安全識別碼 id
  const teacherObject = {
    id: 't_' + Date.now().toString(), // 使用時間戳記生成唯一的 ID
    name: name,
  };

  // 確保 teachers 陣列存在並推入新老師
  if (!settings.value.teachers) {
    settings.value.teachers = [];
  }
  settings.value.teachers.push(teacherObject);

  await save(); // 同步回傳 Firebase
  newTeacherName.value = ''; // 清空輸入框
};

// ====== 💡 步驟 4：新增校區管理邏輯 ======
const isCampusEditing = ref(false);
const newCampusName = ref('');

const toggleCampusEdit = async () => {
  if (isCampusEditing.value) await save();
  isCampusEditing.value = !isCampusEditing.value;
};

const addCampus = async () => {
  const name = newCampusName.value.trim();
  if (!name) return;
  
  if (!settings.value.campuses) settings.value.campuses = [];
  settings.value.campuses.push({
    id: 'cp_' + Date.now().toString(),
    name: name
  });

  await save();
  newCampusName.value = '';
};

// ====== 💡 步驟 5：新增行政人員管理邏輯 ======
const isStaffEditing = ref(false);
const newStaffName = ref('');

const toggleStaffEdit = async () => {
  if (isStaffEditing.value) await save();
  isStaffEditing.value = !isStaffEditing.value;
};

const addStaff = async () => {
  const name = newStaffName.value.trim();
  if (!name) return;

  if (!settings.value.staffs) settings.value.staffs = [];
  settings.value.staffs.push({
    id: 'st_' + Date.now().toString(),
    name: name
  });

  await save();
  newStaffName.value = '';
};

</script>
