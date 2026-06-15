<script setup>
import { ref, watch } from 'vue'
import { useCrud } from '@/composables/useCrud'
import DualListSelector from '@/components/base/DualListSelector.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useEnrollmentService } from '@/modules/enrollment/useEnrollmentService'

const props = defineProps({
  course: Object,
  isOpen: Boolean
})

const emit = defineEmits(['update:isOpen'])

// 🔹 全域資料
const { list: students } = useCrud('students')

const { getByCourse, syncCourseStudents } = useEnrollmentService()

const selectedIds = ref([])

watch(
  () => props.isOpen,
  (open) => {
    if (!open || !props.course?.id) return

    const enrollments = getByCourse(props.course.id)

    selectedIds.value = enrollments.map(e => e.studentId)
  },
  { immediate: true }
)

const formatStudentLabel = (student) => {
  const name = student.chName || '未命名'

  // 優先順序你可以自己調整
  const extra =
    student.enName ||
    student.code

  return extra
    ? `${name}（${extra}）`
    : name
}

// 🔥 儲存
const isSaving = ref(false)

const handleSave = async () => {
  if (!props.course?.id) return

  try {
    isSaving.value = true

    await syncCourseStudents(
      props.course.id,
      selectedIds.value
    )

    closeModal()
  } catch (err) {
    console.error(err)
  } finally {
    isSaving.value = false
  }
}

const closeModal = () => {
  emit('update:isOpen', false)
}

watch(
  () => props.isOpen,
  async (open) => {
    if (!open || !props.course?.id) return

    const enrollments = await getByCourse(props.course.id)

    // 🔥 每次重新覆蓋（這就是 reset）
    selectedIds.value = enrollments.map(e => e.studentId)
  }
)
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>選擇修課學生</h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
        <DualListSelector
          :items="students"
          v-model="selectedIds"
          :get-label="formatStudentLabel"
        />
      </div>
      
      <div class="modal-footer">
        <BaseButton
          variant="outline"
          text="取消"
          @click="closeModal"
        />
        <BaseButton
          variant="primary"
          icon="💾"
          text="儲存變更"
          @click="handleSave"
          responsive
        />
      </div>
    </div>
  </div>
</template>