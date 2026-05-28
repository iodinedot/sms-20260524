<template>
  <div class="billing-page">
    <h2 class="page-title">帳單紀錄管理</h2>
    <div class="manager-toolbar">
      <!-- 左側：搜尋框 (佔據剩餘空間) -->
      <div class="toolbar-search">
        <SearchBar
          v-model="searchQuery"
          placeholder="搜尋學生姓名或帳單編號..."
        />

        <!-- 右側：篩選選單與按鈕 -->
        <select v-model="statusFilter" class="base-select width-auto">
          <option value="all">所有狀態</option>
          <option :value="0">未繳費</option>
          <option :value="1">已繳費</option>
        </select>
      </div>
      <BaseButton
        variant="danger"
        icon="🗑"
        text="刪除選取"
        :disabled="selectedBillIds.length === 0"
        @click="batchDeleteBills"
        responsive
      />
    </div>

    <div class="status-bar">
      <span class="text-small" v-if="searchQuery.trim() !== ''">
        🔍 找到 {{ filteredBills.length }} 筆結果
      </span>
      <span v-if="selectedBillIds.length > 0" class="text-small">
        已選取 <strong>{{ selectedBillIds.length }}</strong> 項
      </span>
    </div>

    <table class="table-card">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="toggleSelectAll"
            />
          </th>
          <th>帳單期別</th>
          <th>學生姓名</th>
          <th>應繳金額</th>
          <th>狀態</th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="bill in filteredBills"
          :key="bill.id"
          :class="{ 'row-selected': selectedBillIds.includes(bill.id) }"
        >
          <td>
            <input type="checkbox" v-model="selectedBillIds" :value="bill.id" />
          </td>
          <td>{{ bill.billingPeriod || bill.startDate }}</td>
          <td>
            <div class="font-bold">{{ bill.studentChName }}</div>
            <div class="text-small" style="color: var(--text-secondary)">
              {{ bill.studentEnName }}
            </div>
          </td>
          <td>NT$ {{ (bill.totalAmount || 0).toLocaleString() }}</td>
          <td>{{ getPaymentStatusText(bill.paymentStatus) }}</td>
          <td style="text-align: center">
            <BaseButton
              variant="outline"
              icon="🧾"
              text="檢視明細"
              responsive
              title="檢視明細"
              @click="openDetail(bill)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="manager-toolbar">
            <h3 class="page-title" style="margin: 0; flex: 1">
              帳單明細 - {{ currentBill.studentChName }}
            </h3>
            <div>
              <BaseButton
                :text="isDetailEditing ? '完成' : '編輯'"
                :variant="isDetailEditing ? 'success' : 'outline'"
                @click="toggleEditMode"
              />

              <BaseButton
                responsive
                variant="outline"
                icon="×"
                text=""
                @click="closeModal"
                class="close-x"
              />
            </div>
          </div>
          <div class="modal-body" :class="{ 'view-only': !isDetailEditing }">
            <div class="toolbar">
              <span class="form-label">繳費狀態：</span>
              <BaseButton
                variant="outline"
                :text="getPaymentStatusText(currentBill.paymentStatus)"
                :disabled="!isDetailEditing"
                :class="
                  currentBill.paymentStatus === 1 ? 'btn-success' : 'btn-danger'
                "
                @click="toggleStatus(currentBill)"
              />
            </div>

            <div class="form-group">
              <label class="form-label">📖 課程費用</label>

              <div
                v-for="(item, idx) in currentBill.items"
                :key="'item-' + idx"
                class="adj-item"
              >
                <div class="adj-left">
                  <span>{{ item.courseName }}</span>
                </div>
                <div class="adj-right">
                  NT$ {{ (item.originalAmount || 0).toLocaleString() }}
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">💼 行政費用</label>

              <div
                v-for="(adj, idx) in currentBill.adjustments || []"
                :key="'adj-' + idx"
                class="adj-item"
              >
                <div class="adj-left">
                  <span>{{ adj.description }}</span>
                </div>
                <div class="adj-right">
                  <span :class="{ 'text-green': adj.amount < 0 }">
                    NT$ {{ (adj.amount || 0).toLocaleString() }}
                  </span>
                  <button
                    v-if="isDetailEditing"
                    @click="removeAdjustment(idx)"
                    class="btn-remove"
                  >
                    ×
                  </button>
                </div>
              </div>

              <p
                v-if="
                  !(currentBill.adjustments && currentBill.adjustments.length)
                "
                class="text-small"
                style="
                  text-align: center;
                  color: var(--text-secondary);
                  margin: 8px 0;
                "
              >
                目前無此類別費用項目
              </p>

              <div
                v-if="isDetailEditing"
                class="adj-input-group"
                style="margin-top: 12px"
              >
                <div class="manager-toolbar">
                  <select
                    v-model="newAdj.description"
                    @change="handleItemSelect"
                    class="base-select width-auto"
                  >
                    <option value="">-- 選擇項目 --</option>
                    <option
                      v-for="opt in adminFeeItems"
                      :key="opt.name"
                      :value="opt.name"
                    >
                      {{ opt.name }}
                    </option>
                  </select>

                  <input
                    type="number"
                    v-model.number="newAdj.amount"
                    class="base-input"
                    placeholder="金額"
                  />
                  <BaseButton
                    variant="primary"
                    icon="➕"
                    text="新增項目"
                    @click="addAdjustment"
                    style="flex-shrink: 0"
                    responsive
                  />
                </div>
                <p class="text-small">
                  * 選擇行政管理設定的收費項目，可自動帶入預設金額
                </p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">帳單備註說明</label>
              <textarea
                v-model="localNote"
                :readonly="!isDetailEditing"
                class="base-textarea"
                :placeholder="
                  isDetailEditing
                    ? '在此輸入此張帳單的特殊備註資訊...'
                    : '無個別備註資訊'
                "
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <div class="final-total" style="margin-left: auto">
              應繳總額：<span>NT$ {{ modalTotalAmount.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { adminService } from '../services/adminService';
import { billingService } from '../services/billingService.js';
import { useTableSelection } from '../composables/useTableSelection';
import SearchBar from '../components/SearchBar.vue';
import BaseButton from '../components/BaseButton.vue';

const props = defineProps({
  activeTab: { type: String, default: '' },
});

// 監聽頁籤切換，當外層變更為帳單分頁時，自動去雲端抓取最新資料
watch(
  () => props.activeTab,
  (newTab) => {
    if (newTab === 'billing') {
      refreshData();
    }
  }
);

const searchQuery = ref('');
const statusFilter = ref('all');
const showModal = ref(false);
const selectedBillId = ref(null);
const isDetailEditing = ref(false); // 控制編輯模式

// 1. 定義從行政管理抓過來的資料
const isLoading = ref(true);
const localBills = ref([]); // 使用本地狀態存放帳單
const adminFeeItems = ref([]);

// 2. 定義新增明細用的暫存變數
const newAdj = ref({
  description: '',
  amount: 0,
});

// 💡 2. 搜尋與狀態篩選計算屬性（完美串接 useTableSelection 核心防線）
const filteredBills = computed(() => {
  return (localBills.value || [])
    .filter((b) => {
      // A. 關鍵字搜尋：支援中文姓名、英文姓名、帳單編號
      const keyword = searchQuery.value.toLowerCase().trim();
      const matchKeyword = !keyword
        ? true
        : (b.studentChName || '').toLowerCase().includes(keyword) ||
          (b.studentEnName || '').toLowerCase().includes(keyword) ||
          (b.id || '').toLowerCase().includes(keyword);

      // B. 狀態列舉篩選：直接比對數字 paymentStatus (0 = 未繳費, 1 = 已繳費)
      const matchStatus =
        statusFilter.value === 'all'
          ? true
          : b.paymentStatus === statusFilter.value;

      // 兩者皆符合才顯示，確保畫面上勾選的資料範圍與 useTableSelection 完全一致
      return matchKeyword && matchStatus;
    })
    .sort((a, b) => b.id.localeCompare(a.id));
});

const currentBill = computed(
  () => localBills.value.find((b) => b.id === selectedBillId.value) || {}
);

const localNote = computed({
  get: () => currentBill.value?.billingNote || '',
  set: (val) => updateCurrentBill({ billingNote: val }),
});

const refreshData = async () => {
  isLoading.value = true;
  try {
    const [billsData, settingsData] = await Promise.all([
      billingService.getBills(),
      adminService.getSettings(),
    ]);
    localBills.value = billsData;
    adminFeeItems.value = settingsData.feeItems || [];
  } catch (error) {
    console.error('帳單資料載入失敗:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(refreshData);

// 🔄 監聽外部傳進來的 activeTab 狀態
watch(
  () => props.activeTab,
  (newTab) => {
    // 💡 只要發現使用者切換到了「繳費單查詢 (billing)」分頁，就自動向雲端重新撈取最新帳單！
    if (newTab === 'billing') {
      refreshData();
    }
  }
);

const openDetail = (bill) => {
  selectedBillId.value = bill.id;
  isDetailEditing.value = false; // 進入時預設為唯讀
  showModal.value = true;
};

const closeModal = () => {
  // 如果正在編輯模式
  if (isDetailEditing.value) {
    const confirmLeave = confirm('你還有修改尚未儲存，確定要離開嗎？');
    if (!confirmLeave) {
      return; // 使用者按下「取消」，留在原地
    }
  }

  // 如果沒在編輯，或是使用者確定要離開，則執行關閉邏輯
  // 這裡放妳原本關閉視窗的程式碼，例如：
  isDetailEditing.value = false;
  showModal.value = false;
};

const toggleEditMode = () => {
  isDetailEditing.value = !isDetailEditing.value;
  if (!isDetailEditing.value) {
    alert('資料已更新完成');
  }
};

// 💡 抽取出來的純粹函式 (Pure Function)
const calculateBillTotal = (bill) => {
  if (!bill) return 0;
  const itemsSubtotal = (bill.items || []).reduce(
    (sum, item) => sum + (Number(item.originalAmount) || 0),
    0
  );
  const adjsSubtotal = (bill.adjustments || []).reduce(
    (sum, adj) => sum + (Number(adj.amount) || 0),
    0
  );
  return itemsSubtotal + adjsSubtotal;
};

// 🛠️ 修改後：完美保留帳單所有欄位並同步更新外層表格的正確版本
const updateCurrentBill = async (updatedFields) => {
  if (!selectedBillId.value) return;

  // 1. 找到目前這筆帳單在本地列表中的索引
  const billIndex = localBills.value.findIndex(
    (b) => b.id === selectedBillId.value
  );
  if (billIndex === -1) return;

  const baseBill = localBills.value[billIndex];

  // 2. 完整合併：先用舊帳單當基底，再覆蓋最新異動的欄位 (例如新的 adjustments)
  const mergedBill = { ...baseBill, ...updatedFields };

  // 3. 計算最新總額
  const newTotal = calculateBillTotal(mergedBill);

  // 4. 將最新的總額直接寫入 mergedBill 之中，確保成為一個「完整且正確」的帳單物件
  mergedBill.totalAmount = newTotal;

  try {
    await billingService.updateBillFields(selectedBillId.value, {
      ...updatedFields,
      totalAmount: newTotal,
    });

    // 6. 🎯 關鍵修正：直接把結構完整的 mergedBill 塞回本地列表
    // 這樣不僅應繳金額會立刻變動，學生的姓名、期別等現有資料也絕對不會被洗掉！
    localBills.value[billIndex] = mergedBill;
  } catch (error) {
    console.error('更新帳單資料或金額失敗:', error);
    alert('儲存變更時發生錯誤');
  }
};

// 🎯 新增：專門給彈窗內部使用的動態總額計算屬性
const modalTotalAmount = computed(() => calculateBillTotal(currentBill.value));

// 🛠️ 修改後的安全版本
const toggleStatus = async (bill) => {
  // 防呆：如果沒傳入參數，就自動抓取當前開啟的 currentBill
  const targetBill = bill && bill.id ? bill : currentBill.value;
  if (!targetBill || !targetBill.id) return;

  const nextStatus = targetBill.paymentStatus === 1 ? 0 : 1;

  await billingService.updateBillFields(targetBill.id, {
    paymentStatus: nextStatus,
  });

  await refreshData();
};

const getPaymentStatusText = (status) => {
  const statusMap = {
    0: '未繳費',
    1: '已繳費',
    2: '已退款',
    3: '已取消',
  };
  return statusMap[status] || '未知狀態';
};

const addAdjustment = () => {
  // 檢查是否有選取項目
  if (!newAdj.value.description || newAdj.value.description === '-1') return;

  const newItem = {
    description: newAdj.value.description,
    amount: newAdj.value.amount,
    isLocked: false,
  };

  const newAdjs = [...currentBill.value.adjustments, newItem];

  // 呼叫更新函式
  updateCurrentBill({ adjustments: newAdjs });

  // 重要：新增完後清空輸入區
  newAdj.value.description = '';
  newAdj.value.amount = 0;
};

const removeAdjustment = (index) => {
  const newAdjs = [...currentBill.value.adjustments];
  newAdjs.splice(index, 1);
  updateCurrentBill({ adjustments: newAdjs });
};

const handleItemSelect = () => {
  // 從 adminFeeItems 找尋名稱符合 newAdj.description 的項目
  const selected = adminFeeItems.value.find(
    (item) => item.name === newAdj.value.description
  );

  if (selected) {
    // 自動帶入預設金額到 newAdj.amount，這會連動到 input 框
    newAdj.value.amount = selected.defaultAmount;
  }
};

const {
  selectedIds: selectedBillIds,
  isAllSelected,
  toggleSelectAll,
  clearSelection,
} = useTableSelection(filteredBills);

// 3. 批次刪除函式
const batchDeleteBills = async () => {
  if (!confirm(`確定要刪除這 ${selectedBillIds.value.length} 份帳單嗎？`))
    return;
  await Promise.all(
    selectedBillIds.value.map((id) => billingService.deleteBill(id))
  );
  selectedBillIds.value = [];
  await refreshData();
  clearSelection();
};

// 監聽搜尋字串與狀態篩選，一旦變動就清空勾選清單
watch([searchQuery, statusFilter], () => {
  if (selectedBillIds.value.length > 0) {
    selectedBillIds.value = [];
  }
});
</script>
