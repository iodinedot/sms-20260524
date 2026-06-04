<script setup>
import BaseButton from '@/components/base/BaseButton.vue';

const props = defineProps({
selectedCount: {
type: Number,
default: 0
}
})

const emit = defineEmits([
'add',
'batch-delete'
])
</script>

<template>
  <div class="manager-toolbar">
    <!-- 搜尋區（slot） -->
    <div class="toolbar-search">
      <slot name="search" />
    </div>

    <!-- 右側按鈕 -->
    <div>
      <span v-if="selectedCount > 0">
        已選 {{ selectedCount }} 筆
      </span>

      <BaseButton
        responsive
        variant="danger"
        icon="🗑"
        :text="`刪除（${selectedCount}）`"
        :disabled="selectedCount === 0"
        @click="$emit('batch-delete')"
      />
      <BaseButton
        responsive
        variant="primary"
        icon="＋"
        text="新增"
        title="新增資料"
        @click="$emit('add')"
      />
    </div>
  </div>
</template>