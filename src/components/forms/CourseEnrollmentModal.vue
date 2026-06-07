<script setup>
import BaseButton from '@/components/base/BaseButton.vue';
import TableRenderer from '../renderers/TableRenderer.vue';
import { ref, computed, watch } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useSettings } from '@/composables/useSettings'


// ===== props =====
const props = defineProps({
  course: Object,
  isOpen: Boolean
})

// ===== crud =====
const studentsCrud = useCrud('students')
const enrollmentsCrud = useCrud('enrollments')
const { getName } = useSettings()
// ===== state =====
const selectedStudentIds = ref([])

// ===== 初始化 =====
const initSelection = () => {
  const enrolled = enrollmentsCrud.list.value
    .filter(e =>
      e.courseId === props.course.id &&
      e.status === 'active'
    )
    .map(e => e.studentId)

  selectedStudentIds.value = [...enrolled]
}

watch(() => props.isOpen, (val) => {
  if (val) initSelection()
})

// ===== toggle =====
const toggle = (studentId) => {
  const list = selectedStudentIds.value

  if (list.includes(studentId)) {
    selectedStudentIds.value =
      list.filter(id => id !== studentId)
  } else {
    selectedStudentIds.value.push(studentId)
  }
}

// ===== table =====
const tableItems = computed(() => {
  return studentsCrud.list.value || []
})

const tableSchema = {
  fields: {
    selected: { label: '' },
    name: { label: '學生姓名' }
  }
}

// ===== save =====
const handleSave = async () => {

  const all = enrollmentsCrud.list.value
    .filter(e => e.courseId === props.course.id)

  const existingActive = all
    .filter(e => e.status === 'active')

  const existingIds = existingActive.map(e => e.studentId)

  const toAdd = selectedStudentIds.value
    .filter(id => !existingIds.includes(id))

  const toRemove = existingActive
    .filter(e => !selectedStudentIds.value.includes(e.studentId))

  for (const studentId of toAdd) {
    await enrollmentsCrud.add({
      studentId,
      courseId: props.course.id,
      status: 'active'
    })
  }

  for (const e of toRemove) {
    await enrollmentsCrud.update({
      ...e,
      status: 'completed'
    })
  }
}
</script>
<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="page-title" style="margin: 0; flex: 1">
          （{{ getName('campuses', course.campusId) }}）{{ course.name }} - 學生管理
        </h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>
      <div class="modal-body">
        <TableRenderer
          :items="tableItems"
          :schema="tableSchema"
        >
          <!-- 🔥 自訂 checkbox -->
          <template #cell-selected="{ item }">
            <input
              type="checkbox"
              :checked="selectedStudentIds.includes(item.id)"
              @change="toggle(item.id)"
            />
          </template>
        </TableRenderer>
      </div>

      <div class="modal-footer">
        <BaseButton
          variant="outline" 
          text="取消" 
          @click="closeModal" 
          :disabled="isSaving" 
        />
      
        <BaseButton
          responsive
          variant="primary"
          icon="✓"
          :text="isSaving ? '儲存中...' : '儲存變更'"
          :disabled="isSaving"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>