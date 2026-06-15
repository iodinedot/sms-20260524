<script setup>
import { ref, watch } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useEnrollmentService } from '@/modules/enrollment/useEnrollmentService'
import DualListSelector from '@/components/base/DualListSelector.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  student: Object,
  isOpen: Boolean
})

const emit = defineEmits(['update:isOpen', 'close'])

// 🔥 資料
const { list: courses } = useCrud('courses')
const { getByStudent, syncStudentCourses } = useEnrollmentService()

// 🔥 選取狀態
const selectedIds = ref([])

// 🔥 初始化（每次打開都 reset）
watch(
  () => props.isOpen,
  (open) => {
    if (!open || !props.student?.id) return

    const enrollments = getByStudent(props.student.id)

    selectedIds.value = enrollments.map(e => e.courseId)
  },
  { immediate: true }
)

// 🔥 儲存
const isSaving = ref(false)

const handleSave = async () => {
  if (!props.student?.id) return

  try {
    isSaving.value = true

    await syncStudentCourses(
      props.student.id,
      selectedIds.value
    )

    emit('close')
  } catch (err) {
    console.error(err)
  } finally {
    isSaving.value = false
  }
}

const close = () => {
  emit('update:isOpen', false)
}

watch(
  () => props.isOpen,
  async (open) => {
    if (!open || !props.student?.id) return

    const enrollments = await getByStudent(props.student.id)

    // 🔥 每次重新覆蓋（這就是 reset）
    selectedIds.value = enrollments.map(e => e.courseId)
  }
)
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal">
      
      <!-- header -->
      <div class="modal-header">
        <h3>選擇課程</h3>
        <BaseButton text="×" variant="outline" @click="close" />
      </div>

      <!-- body -->
      <div class="modal-body">
        <DualListSelector
          :items="courses"
          v-model="selectedIds"
          labelKey="name"
        />
      </div>

      <!-- footer -->
      <div class="modal-footer">
        <BaseButton
          variant="outline"
          text="取消"
          @click="close"
        />

        <BaseButton
          variant="primary"
          text="儲存"
          :disabled="isSaving"
          @click="handleSave"
          responsive
        />
      </div>

    </div>
  </div>
</template>