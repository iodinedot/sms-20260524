<script setup>
import { ref } from 'vue';
import { ResponsiveButton } from './Buttons.vue'; //

// 1. 宣告接收的屬性：由父元件統一發放的老師資料陣列
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

// 2. 宣告定義的事件：通知父元件資料需要更新
const emit = defineEmits(['update:items']);

// 3. 在地暫存變數：僅用來綁定輸入框（切換手風琴時，打到一半的字會安全存活在記憶體中）
const newTeacherName = ref('');

// 4. 新增老師的處理邏輯
const handleAddTeacher = () => {
  const name = newTeacherName.value.trim(); //
  if (!name) return; // 防呆：沒打字就不執行

  // 複製一份全新陣列（不直接修改 props），並補上一個獨特 ID（未來若要延伸更安全）
  const updatedItems = [
    ...props.items,
    {
      id: 't_' + Date.now().toString(), // 產生一個簡單的不重複 ID
      name: name,
    },
  ];

  // 透過事件將全新陣列往上拋，交由父元件統一同步 Firebase
  emit('update:items', updatedItems);

  // 成功後清空輸入框，等待下一次輸入
  newTeacherName.value = '';
};

// 5. 刪除老師的處理邏輯
const handleDeleteTeacher = (index) => {
  if (confirm('確定要刪除此項目嗎？')) {
    //
    // 複製一份陣列進行操作
    const updatedItems = [...props.items];
    updatedItems.splice(index, 1); // 刪除指定索引的老師

    // 同樣透過事件往上拋
    emit('update:items', updatedItems);
  }
};
</script>

<template>
  <div class="teacher-manager">
    <div class="op-group">
      <input
        v-model="newTeacherName"
        class="base-input"
        placeholder="請輸入老師姓名，例如：王大同"
        @keyup.enter="handleAddTeacher"
      />
      <ResponsiveButton
        variant="primary"
        icon="➕"
        text="新增老師"
        :disabled="!newTeacherName.trim()"
        @click="handleAddTeacher"
      />
    </div>

    <div class="item-list" style="margin-top: 16px">
      <div v-if="!items?.length" class="empty-hint">
        目前尚無設定任何授課老師。
      </div>
      <div
        v-for="(teacher, index) in items"
        :key="teacher.id || index"
        class="admin-item-row"
      >
        <div class="item-info">
          <span class="item-name">{{ teacher.name }}</span>
        </div>

        <ResponsiveButton
          variant="remove"
          icon="x"
          text="刪除"
          @click="handleDeleteTeacher(index)"
        />
      </div>
    </div>
  </div>
</template>
