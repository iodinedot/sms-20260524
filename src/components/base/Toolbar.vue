<script setup>
import '@/assets/css/toolbar.css'
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

    <!-- ROW 1 -->
    <div class="toolbar-row">
      <div class="toolbar-search">
        <slot name="search" />
      </div>

      <div class="toolbar-actions">
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

    <!-- ROW 2 -->
    <div class="toolbar-row-secondary">
      <slot />
    </div>

  </div>
</template>