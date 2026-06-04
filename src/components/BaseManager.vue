<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCrud } from '../composables/useCrud'
import { settingsSchema } from '@/schemas/settingsSchema'
import BaseButton from '@/components/base/BaseButton.vue'
import SearchBar from '@/components/base/SearchBar.vue'
import ImportPreviewModal from '../components/ImportPreviewModal.vue'

// props
const props = defineProps({
  type: {
    type: String,
    required: true
  }
})
// 🔥 schema
const schema = settingsSchema[props.type]

// preview
const previewOpen = ref(false)
const previewData = ref([])

// 🔥 CRUD
const {
  list,
  add,
  update,
  remove,
  createEmpty,
  subscribe,    // for auto refresh
  stop          // for auto refresh
} = useCrud(props.type)   // only subscribe once here

// UI state
const isFormVisible = ref(false)
const isEditing = ref(false)
const form = ref({})
const fieldErrors = ref({})

onMounted(() => {
  subscribe()
})

onUnmounted(() => {
  stop()
})

// 🔥 欄位 keys
const fieldEntries = computed(() => {
  return Object.entries(schema.fields)
})

// ==========================================
// 🎯 1️⃣ 搜尋、篩選與分頁的狀態 (State)
// ==========================================
const searchQuery = ref('')
const activeFilters = ref({}) // 格式如: { year: '2026' }
const currentPage = ref(1)
const pageSize = ref(10) // 可自行調整預設每頁筆數

// 當搜尋或篩選條件改變時，自動重置回第一頁
watch([searchQuery, activeFilters], () => {
  currentPage.value = 1
}, { deep: true })

// ==========================================
// 🎯 2️⃣ 資料流核心：Computed 處理鏈
// ==========================================

// 第一步：關鍵字搜尋過濾
const filteredBySearch = computed(() => {
  if (!searchQuery.value) return list.value
  
  const query = searchQuery.value.toLowerCase()
  return list.value.filter(item => {
    // 遍歷當前 schema 定義的所有欄位進行全文檢索
    return fieldEntries.value.some(([key]) => {
      const val = item[key]
      return val !== undefined && val !== null && String(val).toLowerCase().includes(query)
    })
  })
})

// 第二步：Schema 驅動的動態篩選
const filteredByFields = computed(() => {
  let result = filteredBySearch.value
  
  if (!schema.filters) return result

  Object.entries(schema.filters).forEach(([filterKey, filterConfig]) => {
    const selectedValue = activeFilters.value[filterKey]
    // 只有當使用者有選擇篩選值，且該值不為空時才執行過濾
    if (selectedValue !== undefined && selectedValue !== '' && selectedValue !== null) {
      if (typeof filterConfig.filter === 'function') {
        result = result.filter(item => filterConfig.filter(item, selectedValue))
      }
    }
  })
  
  return result
})

// 第三步：分頁裁剪
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredByFields.value.slice(start, end)
})

// 總頁數計算
const totalPages = computed(() => {
  return Math.ceil(filteredByFields.value.length / pageSize.value) || 1
})

// 動態產生篩選選單的選項 (由當前 list 決定或靜態定義)
const filterOptionsMap = computed(() => {
  const maps = {}
  if (!schema.filters) return maps

  Object.entries(schema.filters).forEach(([key, filterConfig]) => {
    if (typeof filterConfig.getOptions === 'function') {
      maps[key] = filterConfig.getOptions(list.value)
    } else {
      maps[key] = filterConfig.options || []
    }
  })
  return maps
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

const handleImport = async (options = {}) => {
  const handler = schema.importConfig?.handler
  if (!handler) return

  const result = await handler({
    existingData: list.value,
    ...options
  })

  previewData.value = result
  previewOpen.value = true
}

const confirmImport = () => {
  previewData.value.forEach(item => add(item)) // 用你 useCrud 的 add

  previewOpen.value = false
  previewData.value = []
}

const getDisplayValue = (field, value) => {
  // boolean
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }

  // select
  if (field.type === 'select' && field.options) {
    const found = field.options.find(opt => opt.value === value)
    return found ? found.label : value
  }

  // default
  return value
}
</script>

<template>
  <div>
    <div class="manager-actions-bar" style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;">
      <BaseButton text="新增" mode="text" @click="handleAdd" />
      <BaseButton icon="📥" text="匯入資料" responsive
        v-if="schema.importConfig?.enabled"
        @click="handleImport"
      />
      
      <SearchBar 
        v-if="schema.searchable !== false"
        v-model="searchQuery" 
        placeholder="搜尋關鍵字..." 
        style="max-width: 240px;"
      />

      <template v-if="schema.filters">
        <div v-for="[filterKey, filterConfig] in Object.entries(schema.filters)" :key="filterKey" class="filter-select-wrapper">
          <select 
            v-model="activeFilters[filterKey]" 
            class="base-input"
            style="min-width: 120px;"
          >
            <option value="">全部{{ filterConfig.label || filterKey }}</option>
            <option 
              v-for="opt in filterOptionsMap[filterKey]" 
              :key="opt.value" 
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </template>
    </div>

    <div v-show="isFormVisible" class="modal-overlay">
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

              <input
                v-if="field.type === 'checkbox'"
                type="checkbox"
                v-model="form[key]"
              />

              <select
                v-else-if="field.type === 'select'"
                v-model="form[key]"
                class="base-input"
              >
                <option
                  v-for="opt in field.options"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>

              <input
                v-else
                :type="field.type || 'text'"
                v-model="form[key]"
                class="base-input"
              />

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

    <ImportPreviewModal
      :open="previewOpen"
      :data="previewData"
      @confirm="confirmImport"
      @close="previewOpen = false"
    />

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
        <tr v-for="item in paginatedList" :key="item.id">
          <td v-for="[key, field] in fieldEntries" :key="key">
            {{ getDisplayValue(field, item[key]) }}
          </td>

          <td>
            <div style="display: flex; gap: 8px;">
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
            </div>
          </td>
        </tr>
        
        <tr v-if="paginatedList.length === 0">
          <td :colspan="fieldEntries.length + 1" style="text-align: center; color: #888; padding: 24px;">
            沒有符合條件的資料
          </td>
        </tr>
      </tbody>
    </table>

    <div 
      v-if="schema.pagination !== false && filteredByFields.length > pageSize" 
      class="pagination-container"
    >
      <div class="pagination-info" style="color: #666; font-size: 14px;">
        共 {{ filteredByFields.length }} 筆資料，
        顯示第 {{ filteredByFields.length ? (currentPage - 1) * pageSize + 1 : 0 }} 至 {{ Math.min(currentPage * pageSize, filteredByFields.length) }} 筆
      </div>
      <div class="pagination-buttons" style="display: flex; gap: 8px; align-items: center;">
        <select v-model="pageSize" class="base-input" style="width: auto; padding: 4px 8px;">
          <option :value="10">10 筆 / 頁</option>
          <option :value="20">20 筆 / 頁</option>
          <option :value="50">50 筆 / 頁</option>
        </select>
        <BaseButton 
          text="上一頁" 
          variant="outline" 
          :disabled="currentPage === 1" 
          @click="currentPage--" 
        />
        <span style="font-size: 14px; color: #333;">{{ currentPage }} / {{ totalPages }}</span>
        <BaseButton 
          text="下一頁" 
          variant="outline" 
          :disabled="currentPage === totalPages" 
          @click="currentPage++" 
        />
      </div>
    </div>
  </div>
</template>