<!-- src/components/BatchActionBar.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedCount: Number,
  actions: Array,
  context: Object
})

const emit = defineEmits(['clear'])

const enabledActions = computed(() => {
  return props.actions.filter(a =>
    !a.enabled || a.enabled(props.context)
  )
})

const handleAction = async (action) => {
  if (!action.handler) return
  await action.handler(props.context)
}
</script>

<template>
  <div v-if="selectedCount > 0" class="batch-bar">
    <div class="left">
      <span>已選 {{ selectedCount }} 筆</span>
      <button class="link" @click="$emit('clear')">清除</button>
    </div>

    <div class="right">
      <!-- ⭐ primary（先保留，下一步接 batchCreate） -->
      <button class="primary">
        批次開帳
      </button>

      <!-- ⭐ dropdown -->
      <div class="dropdown">
        <button>操作 ▼</button>
        <div class="menu">
          <button
            v-for="action in enabledActions"
            :key="action.key"
            @click="handleAction(action)"
            :class="['menu-item', action.type]"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  margin-bottom: 8px;
}

.left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.primary {
  background: #3b82f6;
  color: white;
  padding: 6px 12px;
}

.dropdown {
  position: relative;
}

.menu {
  position: absolute;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  display: none;
}

.dropdown:hover .menu {
  display: block;
}

.menu-item {
  display: block;
  padding: 6px 12px;
  width: 100%;
  text-align: left;
}

.menu-item.danger {
  color: red;
}
</style>