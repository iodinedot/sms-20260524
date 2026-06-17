<script setup>
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import BaseButton from '@/components/base/BaseButton.vue'
import { filterFields } from '@/utils/fieldFilter'
import { formatPeriod } from '@/utils/formatters'

const props = defineProps({
  items: Array,
  fields: Object,
  selectable: Boolean,
  selectedIds: { type: Array, default: () => [] },
  isAllSelected: Boolean,
})

const emit = defineEmits(['toggle-select','toggle-select-all', 'row-click', 'edit'])

const { getName } = useSettings()

const visibleColumns = computed(() => {
  return filterFields(props.fields, null, 'table')
})

const formatValue = (value, field) => {
  if (value == null) return ''

  // 🔵 optionsKey（原本的）
  if (field.type === 'select' && field.optionsKey) {
    return getName(field.optionsKey, value)
  }

  // 🟢 options（新增這段）
  if (field.type === 'select' && field.options) {
    const found = field.options.find(opt => opt.value === value)
    return found?.label || ''
  }

  if (field.type === 'period') {
    value = formatPeriod(value, "range")
  }
  return value
}
</script>

<template>
  <table  class="table-card">
    <thead>
      <tr>
        <!-- selectable -->
        <th v-if="selectable">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="$emit('toggle-select-all', $event)"
          />
        </th>
        
        <th v-for="[key, field] in visibleColumns" :key="key">
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
          <input
            type="checkbox"
            :checked="selectedIds.includes(item.id)"
            @click.stop
            @change="$emit('toggle-select', item.id)"
          />
        </td>

        <!-- 資料欄位 -->
        <td v-for="[key, field] in visibleColumns" :key="key">
          <!-- ⭐ slot（可覆蓋） -->
          <slot
            :name="`cell-${key}`"
            :item="item"
            :value="item[key]"
          >
            {{ formatValue(item[key], field) }}
          </slot>
        </td>

        <!-- actions -->
        <td>
          <slot name="actions" :item="item">
            <!-- 預設只有編輯 -->
            <BaseButton
              responsive
              variant="outline"
              icon="✏️"
              text="編輯"
              @click.stop="$emit('edit', item)"
            />
          </slot>
        </td>

      </tr>
    </tbody>
  </table>
</template>