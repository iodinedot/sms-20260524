<!-- components/SettingsListManager.vue -->
<template>
  <div class="settings-block">
      <div class="toolbar">
        <input
          v-model="newItem.name"
          class="base-input"
          placeholder="請輸入..."
        />
        <ResponsiveButton
          variant="primary"
          icon="＋"
          text="新增"
          @click="handleAdd"
        />
      </div>
      
      
      <div v-for="(item, index) in modelValue" :key="item.id" class="list-item">
        <input v-model="item.name" class="base-input"/>
        <ResponsiveButton
          variant="remove"
          icon="x"
          text="刪除"
          @click="handleDelete(index)"
        />
      </div>
    
  </div>
</template>
  
<script setup>
import { ref, watch } from 'vue'
import { ResponsiveButton } from '../components/Buttons.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  prefix: {
    type: String,
    default: 'id_'
  }
})

const emit = defineEmits(['update:modelValue'])

// ===== 本地狀態 =====
const items = ref([])
// 新增用
const newItem = ref({
  name: ''
})

// ⭐ 同步外部資料（重要）
watch(
  () => props.modelValue,
  (val) => {
    items.value = (val || []).map(item => ({
      id: item.id || generateId(),
      name: item.name || ''
    }))
  },
  { immediate: true, deep: true }
)

// ===== helper =====
const emitUpdate = () => {
  emit('update:modelValue', items.value)
}

const generateId = () => {
  return `${props.prefix}${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

// ===== 新增 =====
const handleAdd = () => {
  if (!newItem.value.name) return

  items.value.push({
    id: generateId(),
    name: newItem.value.name
  })

  newItem.value = {
    name: ''
  }

  emitUpdate()
}

// ===== 刪除 =====
const handleDelete = (id) => {
  items.value = items.value.filter(i => i.id !== id)
  emitUpdate()
}
</script>