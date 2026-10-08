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
// courses 已經由 initGlobalSubscriptions（App 啟動時）確保訂閱，
// 這裡不需要再自己呼叫 ensureSubscribed。
const { list: courses } = useCrud('courses')
const { getByStudent, syncStudentCourses } = useEnrollmentService()

// 🔥 選取狀態
const selectedIds = ref([])

// 🔥 初始化（每次打開都 reset）
// 原本這裡重複寫了兩個幾乎一樣的 watch(isOpen)（一個當
// getByStudent 是同步、一個當它是非同步），合併成一個，
// 統一用 await 處理，兩種情況都相容。
watch(
  () => props.isOpen,
  async (open) => {
    if (!open || !props.student?.id) return

    const enrollments = await getByStudent(props.student.id)

    // 🔥 每次重新覆蓋（這就是 reset）
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