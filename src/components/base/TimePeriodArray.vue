<script setup>
import { computed } from 'vue'
import { WEEKDAY_OPTIONS } from '@/constants/options'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const list = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ➕ 新增一列
const addItem = () => {
  list.value = [
    ...list.value,
    {
      dayOfWeek: 1,
      startTime: '',
      endTime: ''
    }
  ]
}

// ❌ 刪除
const removeItem = (index) => {
  list.value = list.value.filter((_, i) => i !== index)
}

// 🔄 更新欄位
const updateItem = (index, key, value) => {
  const newList = [...list.value]
  newList[index] = {
    ...newList[index],
    [key]: value
  }
  list.value = newList
}
</script>

<template>
  <div class="time-period">
    <div
      v-for="(item, index) in list"
      :key="index"
      class="row"
    >
      <!-- 星期 -->
      <select
        :value="item.dayOfWeek"
        @change="updateItem(index, 'dayOfWeek', Number($event.target.value))"
      >
        <option
          v-for="opt in WEEKDAY_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- 開始時間 -->
      <input
        type="time"
        :value="item.startTime"
        @input="updateItem(index, 'startTime', $event.target.value)"
      />

      <!-- 結束時間 -->
      <input
        type="time"
        :value="item.endTime"
        @input="updateItem(index, 'endTime', $event.target.value)"
      />

      <!-- 刪除 -->
      <button @click="removeItem(index)">刪除</button>
    </div>

    <button @click="addItem">＋新增時段</button>
  </div>
</template>