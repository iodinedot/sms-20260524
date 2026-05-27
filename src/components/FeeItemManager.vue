<script setup>
import { ref, computed } from 'vue'
import { ResponsiveButton } from '../components/Buttons.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// 本地狀態
const items = ref([...props.modelValue])

// 新增用
const newItem = ref({
  name: '',
  defaultAmount: 0,
  isEditable: true,
  isRequired: false
})

// 同步 v-model
const update = () => {
  emit('update:modelValue', items.value)
}

// 新增
const handleAdd = () => {
  if (!newItem.value.name) return

  items.value.push({
    id: `f_${Date.now()}`,
    name: newItem.value.name,
    defaultAmount: Number(newItem.value.defaultAmount) || 0,
    isEditable: newItem.value.isEditable,
    isRequired: newItem.value.isRequired,
    order: items.value.length + 1
  })

  newItem.value = {
    name: '',
    defaultAmount: 0,
    isEditable: true,
    isRequired: false
  }

  update()
}

// 刪除
const handleDelete = (id) => {
  items.value = items.value.filter(i => i.id !== id)
  update()
}

// 排序（簡單版）
const moveUp = (index) => {
  if (index === 0) return
  const temp = items.value[index]
  items.value[index] = items.value[index - 1]
  items.value[index - 1] = temp
  update()
}

const moveDown = (index) => {
  if (index === items.value.length - 1) return
  const temp = items.value[index]
  items.value[index] = items.value[index + 1]
  items.value[index + 1] = temp
  update()
}

// 金額格式
const formatCurrency = (val) => {
  return Number(val).toLocaleString()
}
</script>

<template>
  <div class="">

    <!-- 新增區 -->
    <div class="manager-toolbar">
      <input
        v-model="newItem.name"
        class="base-input"
        placeholder="費用名稱"
      />
      <input
        v-model="newItem.defaultAmount"
        type="number"
        class="base-input"
        placeholder="預設金額"
      />
      <label class="inline-check">
        <input type="checkbox" v-model="newItem.isEditable" />
        可調整
      </label>
      <label class="inline-check">
        <input type="checkbox" v-model="newItem.isRequired" />
        必收
      </label>
      <ResponsiveButton
        variant="primary"
        icon="＋"
        text="新增"
        @click="handleAdd"
      />
    </div>

    <!-- 表格 -->
    <table class="table-card">
      <thead>
        <tr>
          <th>名稱</th>
          <th>預設金額</th>
          <th>可調整</th>
          <th>必收</th>
          <th>排序</th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(item, index) in items" :key="item.id">
          <td>
            <input
              v-model="item.name"
              class="base-input width-auto"
              @change="update"
            />
          </td>

          <td>
            <input
              type="number"
              v-model="item.defaultAmount"
              class="base-input"
              @change="update"
            />
          </td>

          <td class="expand-row">
            <input
              type="checkbox"
              v-model="item.isEditable"
              @change="update"
            />
          </td>

          <td>
            <input
              class="nowrap"
              type="checkbox"
              v-model="item.isRequired"
              @change="update"
            />
          </td>

          <td>
            <div class="op-group">
              <button class="btn btn-outline" @click="moveUp(index)">↑</button>
              <button class="btn btn-outline" @click="moveDown(index)">↓</button>
            </div>
          </td>

          <td>
            <ResponsiveButton
              variant="remove"
              icon="x"
              text="刪除"
              @click="handleDelete(item.id)"
            />
          </td>
        </tr>

        <tr v-if="items.length === 0">
          <td colspan="6" class="empty-hint">
            尚未設定費用項目
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>