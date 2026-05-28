<script setup>
import { ref, onMounted } from 'vue'
import { useSettings } from '../composables/useSettings'
import { useCrud } from '../composables/useCrud'

// 🔥 接入 settings
const { loadSettings, saveSettings } = useSettings()
const {
  list: campuses,
  add,
  update,
  remove
} = useCrud('campuses')


// UI 狀態
const isFormVisible = ref(false)
const isEditing = ref(false)

// 表單資料
const form = ref({
  id: '',
  name: '',
  address: '',
  phone: ''
})

const campuses = computed(() => settings.value?.campuses || [])

// 初始化
onMounted(async () => {
  await loadSettings()
})
// 新增
const handleAdd = () => {
  isFormVisible.value = true
  isEditing.value = false
  form.value = {
    id: '',
    name: '',
    address: '',
    phone: ''
  }
}

// 編輯
const handleEdit = (item) => {
  isFormVisible.value = true
  isEditing.value = true
  form.value = { ...item }
}

// 儲存（核心改動）
const handleSave = async () => {
  if (!form.value.name) return

  const list = [...(settings.value.campuses || [])]

  if (isEditing.value) {
    const index = list.findIndex(i => i.id === form.value.id)
    if (index !== -1) {
      list[index] = { ...form.value }
    }
  } else {
    list.push({
      id: `c_${Date.now()}`,
      name: form.value.name,
      address: form.value.address,
      phone: form.value.phone
    })
  }

  // 🔥 關鍵：更新 settings
  settings.value.campuses = list

  await saveSettings()

  isFormVisible.value = false
}

// 刪除
const handleDelete = async (id) => {
  const confirmed = window.confirm('確定要刪除這筆資料嗎？')
  if (!confirmed) return

  const list = (settings.value.campuses || []).filter(i => i.id !== id)

  settings.value.campuses = list

  await saveSettings()
}

// 取消
const handleCancel = () => {
  isFormVisible.value = false
}
</script>

<template>
  <div>
    <h2>校區管理</h2>

    <button @click="handleAdd">新增校區</button>

    <!-- 表單 -->
    <div v-if="isFormVisible">
      <h3>{{ isEditing ? '編輯校區' : '新增校區' }}</h3>

      <form @submit.prevent="handleSave">
        <div>
          <label>校區名稱</label>
          <input v-model="form.name" />
        </div>

        <div>
          <label>地址</label>
          <input v-model="form.address" />
        </div>

        <div>
          <label>電話</label>
          <input v-model="form.phone" />
        </div>

        <button type="submit">儲存</button>
        <button type="button" @click="handleCancel">取消</button>
      </form>
    </div>

    <!-- 列表 -->
    <table border="1">
      <thead>
        <tr>
          <th>名稱</th>
          <th>地址</th>
          <th>電話</th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in campuses" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.address }}</td>
          <td>{{ item.phone }}</td>
          <td>
            <button @click="handleEdit(item)">編輯</button>
            <button @click="handleDelete(item.id)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>