<script setup>
import { ref } from 'vue';
import { ResponsiveButton } from './Buttons.vue'; // 引入自訂的響應式按鈕

// 1. 定義接收的屬性：接收父元件傳下來的繳費項目陣列
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

// 2. 定義拋出的事件：通知父元件資料變更
const emit = defineEmits(['update:items']);

// 3. 子元件內部的專屬暫存變數（維持獨立的生命週期，切換折疊不遺失）
const newFeeItem = ref({ name: '', defaultAmount: 0 });

// 4. 新增繳費項目的在地邏輯
const handleAddFee = () => {
  const name = newFeeItem.value.name.trim();
  if (!name) return;

  // 複製一份新陣列（遵循 Vue 單向資料流，不直接修改 props）
  const updatedItems = [
    ...props.items,
    {
      name: name,
      defaultAmount: Number(newFeeItem.value.defaultAmount) || 0,
    },
  ];

  // 透過事件傳回父元件，由父元件發動儲存並更新 Firebase
  emit('update:items', updatedItems);

  // 成功後重置內部輸入框
  newFeeItem.value = { name: '', defaultAmount: 0 };
};

// 5. 刪除繳費項目的在地邏輯
const handleDeleteFee = (index) => {
  if (confirm('確定要刪除此項目嗎？')) {
    //
    const updatedItems = [...props.items];
    updatedItems.splice(index, 1);

    // 通知父元件同步變更
    emit('update:items', updatedItems);
  }
};
</script>
<template>
  <div class="fee-item-manager">
    <div class="op-group">
      <input
        v-model="newFeeItem.name"
        class="base-input"
        placeholder="例如：教材費、雜費"
      />
      <input
        v-model.number="newFeeItem.defaultAmount"
        type="number"
        class="base-input"
        placeholder="預設金額"
        @keyup.enter="handleAddFee"
      />

      <ResponsiveButton
        variant="primary"
        icon="➕"
        text="新增"
        :disabled="!newFeeItem.name"
        @click="handleAddFee"
      />
    </div>

    <div class="item-list" style="margin-top: 16px">
      <div v-if="!items?.length" class="empty-hint">
        目前尚無設定任何繳費項目。
      </div>

      <div v-for="(item, index) in items" :key="index" class="admin-item-row">
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-price">預設金額：${{ item.defaultAmount }}</span>
        </div>

        <ResponsiveButton
          variant="remove"
          icon="x"
          text="刪除"
          @click="handleDeleteFee(index)"
        />
      </div>
    </div>
  </div>
</template>
