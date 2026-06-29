<script setup>
import '@/assets/css/toolbar.css'
import BaseButton from '@/components/base/BaseButton.vue';

const props = defineProps({
  mode: {
    type: String,
    default: 'normal'
  },
  selectedCount: Number,

  toolbarActions: Object,   // ⭐ normal mode config
  batchActions: Array       // ⭐ batch actions
})

const emit = defineEmits(['clear'])
</script>

<template>
  <div class="toolbar">

    <!-- 🟢 NORMAL MODE -->
    <template v-if="mode === 'normal'">
      
      <!-- Search -->
      <slot name="search" v-if="toolbarActions?.showSearch" />

      <!-- Actions（例如批次建立） -->
      <slot name="actions" />

      <!-- Filters -->
      <slot name="filters" />

    </template>

    <!-- 🔴 BATCH MODE -->
    <template v-else>
      
      <!-- 選取數 -->
      <div class="batch-info">
        已選 {{ selectedCount }} 筆
      </div>

      <!-- Actions -->
      <div class="batch-actions">
        <BaseButton
          v-for="action in batchActions"
          :key="action.key"
          :text="action.label"
          :variant="action.type || 'primary'"
          :disabled="action.enabled === false"
          @click="action.handler"
        />
      </div>

      <!-- 清除 -->
      <BaseButton
        text="清除"
        variant="outline"
        @click="$emit('clear')"
      />

    </template>

  </div>
</template>