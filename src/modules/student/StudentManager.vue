<script setup>
import { ref } from 'vue';
import StudentEnrollmentModal from '@/modules/student/StudentEnrollmentModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseManager from '@/components/base/BaseManager.vue';
import { schemas } from '@/schemas'

const isEnrollmentModalOpen = ref(false);
const currentStudentForEnrollment = ref(null);

const openEnrollmentModal = (student) => {
  currentStudentForEnrollment.value = student;
  isEnrollmentModalOpen.value = true;
};
</script>

<template>
  <BaseManager
    type="students"
    :schema="schemas.students"
    :show-title="true"
  >
    <template #actions="{ item }">
      <BaseButton
        responsive
        variant="outline"
        icon="📚"
        text="設定課程"
        @click.stop="openEnrollmentModal(item)"
      />
    </template>
  </BaseManager>

  <StudentEnrollmentModal
    v-model:isOpen="isEnrollmentModalOpen"
    :student="currentStudentForEnrollment"
    @close="isEnrollmentModalOpen = false"
  />
</template>
