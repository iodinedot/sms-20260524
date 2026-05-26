<!-- components/SettingsListManager.vue -->
<template>
    <div class="settings-block">
      <h3>{{ title }}</h3>
  
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名稱</th>
            <th></th>
          </tr>
        </thead>
  
        <tbody>
          <tr v-for="(item, index) in modelValue" :key="item.id">
            <td>{{ item.id }}</td>
  
            <td>
              <input v-model="item.name" />
            </td>
  
            <td>
              <button @click="remove(index)">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <button @click="add">新增</button>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    modelValue: Array,
    title: String,
    prefix: String, // e.g. 't_' / 'c_'
  })
  
  const emit = defineEmits(['update:modelValue'])
  
  const add = () => {
    const newItem = {
      id: props.prefix + Date.now(),
      name: ''
    }
  
    emit('update:modelValue', [...props.modelValue, newItem])
  }
  
  const remove = (index) => {
    const list = [...props.modelValue]
    list.splice(index, 1)
    emit('update:modelValue', list)
  }
  </script>