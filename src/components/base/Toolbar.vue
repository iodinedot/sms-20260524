<script setup>
import BaseButton from '@/components/base/BaseButton.vue';

const props = defineProps({
  mode: {
    type: String,
    default: 'normal'
  },

  selectedCount: Number,

  toolbar: {
    type: Object,
    default: () => ({})
  },

  batchActions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['clear'])
</script>

<template>
  <div class="manager-toolbar">

    <!-- 🟢 NORMAL MODE -->
    <template v-if="mode === 'normal'">

      <!-- 🔹 第一排：主操作優先 -->
      <div class="toolbar-row">

        <!-- 左：主要操作 -->
        <div class="toolbar-primary">
          <!-- 主要動作（例如新增、開帳） -->
          <slot name="primary-actions" />

          <!-- 次要動作（匯入、匯出） -->
          <div class="toolbar-secondary-actions">
            <slot name="actions" />
          </div>
        </div>

        <!-- 右：搜尋 -->
        <div class="toolbar-search">
          <slot name="search" v-if="toolbar.search" />
        </div>

      </div>

      <!-- 🔹 第二排：filters -->
      <div
        v-if="$slots.filters"
        class="toolbar-row-secondary"
      >
        <slot name="filters" />
      </div>

    </template>

    <!-- 🔴 BATCH MODE -->
    <template v-else>

      <div class="toolbar-row">

        <!-- 左：選取資訊 -->
        <div class="batch-info">
          已選 {{ selectedCount }} 筆
        </div>

        <!-- 右：批次操作 -->
        <div class="toolbar-actions">

          <!-- 👉 未來可以改 dropdown -->
          <template v-if="batchActions?.length <= 3">
            <BaseButton
              v-for="action in batchActions"
              :key="action.key"
              :text="action.label"
              :variant="action.type || 'primary'"
              :disabled="action.enabled === false"
              @click="action.handler"
            />
          </template>

          <!-- 👉 多於3個，建議用單一入口 -->
          <template v-else>
            <BaseButton
              text="批次操作"
              @click="batchActions[0]?.handler"
            />
          </template>

          <BaseButton
            text="清除"
            variant="outline"
            @click="$emit('clear')"
          />
        </div>
      </div>
    </template>
  </div>
</template>