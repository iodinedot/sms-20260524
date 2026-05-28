<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettings } from '../composables/useSettings'
import { useCrud } from '../composables/useCrud'
import { settingsSchema } from '../composables/settingsSchema'
import BaseButton from './BaseButton.vue'

// props
const props = defineProps({
  type: {
    type: String,
    required: true
  }
})

// 🔥 schema
const schema = settingsSchema[props.type]

// 🔥 settings 初始化
const { loadSettings } = useSettings()

// 🔥 CRUD
const {
  list,
  add,
  update,
  remove,
  createEmpty
} = useCrud(props.type)

// UI state
const isFormVisible = ref(false)
const isEditing = ref(false)
const form = ref({})
const fieldErrors = ref({})

// 🔥 初始化
onMounted(async () => {
  await loadSettings()
})

// 🔥 欄位 keys
const fieldEntries = computed(() => {
  return Object.entries(schema.fields)
})

const validate = () => {
  fieldErrors.value = {}

  let hasError = false

  fieldEntries.value.forEach(([key, field]) => {
    if (!field.required) return

    const value = form.value[key]

    const isEmpty =
      value === '' ||
      value === null ||
      value === undefined

    if (isEmpty) {
      fieldErrors.value[key] = `${field.label || key} 為必填`
      hasError = true
    }
  })

  return !hasError
}

// 🔹 開新增
const handleAdd = () => {
  isEditing.value = false
  form.value = createEmpty()
  fieldErrors.value = {}
  isFormVisible.value = true
}

// 🔹 開編輯
const handleEdit = (item) => {
  isEditing.value = true
  form.value = { ...item }
  fieldErrors.value = {}
  isFormVisible.value = true
}

// 🔹 儲存
const handleSave = async () => {
  if (!validate()) return

  if (isEditing.value) {
    await update(form.value)
  } else {
    await add(form.value)
  }
  isFormVisible.value = false
}

// 🔹 刪除
const handleDelete = async (id) => {
  if (!window.confirm('確定刪除？')) return
  await remove(id)
}

const handleCancel = () => {
  isFormVisible.value = false
  fieldErrors.value = {}   // 🔥 清掉
}

// 🔹 input type 決定
const getInputType = (field) => {
  if (field.type === 'number') return 'number'
  if (field.type === 'checkbox') return 'checkbox'
  return 'text'
}
</script>

<template>
  <div>
    <!-- 新增按鈕 -->
    <BaseButton text="新增" mode="text" @click="handleAdd"/>

    <!-- 🔥 Modal -->
    <div v-if="isFormVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="manager-toolbar">
          <h3 class="page-title" style="margin: 0; flex: 1">
            {{ isEditing ? '編輯資料' : '新增資料' }}
          </h3>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body">
            <div
              v-for="[key, field] in fieldEntries"
              :key="key"
              class="form-group"
            >
              <label class="form-label">{{ field.label }}</label>

              <!-- checkbox -->
              <input
                v-if="field.type === 'checkbox'"
                type="checkbox"
                v-model="form[key]"
              />

              <!-- 其他 -->
              <input
                v-else
                :type="getInputType(field)"
                v-model="form[key]"
                class="base-input"
              />

              <!-- 🔥 錯誤訊息 -->
              <div v-if="fieldErrors[key]" style="color: red;">
                {{ fieldErrors[key] }}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <BaseButton
              variant="outline"
              type="button"
              text="取消"
              @click="handleCancel"
            />
            <BaseButton variant="primary" type="submit" text="儲存" />
          </div>

        </form>
      </div>
    </div>

    <!-- 表格 -->
    <table class="table-card">
      <thead>
        <tr>
          <th v-for="[key, field] in fieldEntries" :key="key">
            {{ field.label || key }}
          </th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td v-for="[key] in fieldEntries" :key="key">
            <span v-if="typeof item[key] === 'boolean'">
              {{ item[key] ? '是' : '否' }}
            </span>
            <span v-else>
              {{ item[key] }}
            </span>
          </td>

          <td>
            <BaseButton 
              @click="handleEdit(item)"
              responsive
              icon="✏️"
              text="修改"
            />
            <BaseButton 
              @click="handleDelete(item.id)"
              responsive
              variant="outline"
              icon="×"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>