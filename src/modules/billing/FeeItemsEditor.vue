<script setup>
const props = defineProps({
  modelValue: Array // 🔥 直接就是 form.feeItems
})

// ❗不 emit、不 clone，直接操作（符合你架構）
const addItem = () => {
  props.modelValue.push({
    feeItemId: '',
    name: '',
    amount: 0,
    subtotal: 0,
    isEditable: true
  })
}

const removeItem = (index) => {
  props.modelValue.splice(index, 1)
}
</script>

<template>
  <div class="fee-items">
    <div v-for="(item, i) in modelValue" :key="i">
      <input v-model="item.name" placeholder="名稱" />

      <input
        type="number"
        v-model.number="item.amount"
        placeholder="金額"
      />

      <button @click="removeItem(i)">刪除</button>
    </div>

    <button @click="addItem">+ 新增項目</button>
  </div>
</template>