<script setup>
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'

const props = defineProps({
  items: Array,
  fields: Object,
  selectable: Boolean,
  selectedIds: Array,
  isAllSelected: Boolean,
})

const emit = defineEmits(['select', 'edit'])

const { getName } = useSettings()

const tableFields = computed(() => {
  return Object.fromEntries(
    Object.entries(props.fields)
      .filter(([_, f]) => f.showInTable !== false)
  )
})

const formatValue = (value, field) => {
  if (value == null) return ''

  if (field.type === 'select') {
    return getName(field, value)
  }

  return value
}
</script>

<template>
  <div>
  已選 {{ selectedIds.length }} 筆
</div>
<button
  @click="handleBatchDelete"
  :disabled="selectedIds.length === 0"
>
  刪除（{{ selectedIds.length }}）
</button>
  <table class="base-table">
    <thead>
      <tr>
        <!-- selectable -->
        <th v-if="selectable">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="$emit('toggle-select-all')"
          />
        </th>
        <th v-for="(field, key) in tableFields" :key="key">
          {{ field.label }}
        </th>

        <!-- actions -->
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in items" :key="item.id" @click="$emit('row-click', item)" >
        <!-- selectable -->
        <td v-if="selectable">
          <td v-if="selectable">
            <input
              type="checkbox"
              :checked="selectedIds.includes(item.id)"
              @click.stop
              @change="$emit('toggle-select', item.id)"
            />
          </td>
        </td>

        <!-- 資料欄位 -->
        <td
          v-for="(field, key) in tableFields"
          :key="key"
        >
          <!-- ⭐ slot（可覆蓋） -->
          <slot
            :name="key"
            :item="item"
            :value="item[key]"
          >
            {{ formatValue(item[key], field) }}
          </slot>
        </td>

        <!-- actions -->
        <td>
          <button @click="$emit('edit', item)">編輯</button>
        </td>

      </tr>
    </tbody>
  </table>
</template>