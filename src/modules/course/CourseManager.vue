<script setup>
import { ref } from 'vue';
import CourseForm from '@/modules/course/CourseForm.vue';
import CourseEnrollmentModal from '@/modules/course/CourseEnrollmentModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseManager from '@/components/base/BaseManager.vue';
import { schemas } from '@/schemas'

const isEnrollmentModalOpen = ref(false);
const currentCourseForEnrollment = ref(null);

const openEnrollmentModal = (course) => {
  currentCourseForEnrollment.value = course;
  isEnrollmentModalOpen.value = true;
};

const getScheduleDisplay = (item) => {
  const schedules = item.schedules
  // 🟢 weekly
  if (schedules && schedules.length > 0) {
    return [
      `每週 ${schedules.length} 堂`,
      ...schedules.map(s =>
        `週${['日','一','二','三','四','五','六'][s.dayOfWeek]} ${s.startTime}~${s.endTime}`
      )
    ]
  }

  // 🔵 period
  if (item.startDate && item.endDate && item.billingType === 'period-total') {
    return [
      '期間上課',
      `${item.startDate} ～ ${item.endDate}`
    ]
  }

  // ⚪ empty
  return ['未設定']
}
</script>

<template>
  <BaseManager
    type="courses"
    :show-title="true"
  >
    <template #schedules="{ item }">
      <div v-for="(line, i) in getScheduleDisplay(item)" :key="i">
        {{ line }}
      </div>
    </template>
    <template #actions="{ item, openCopy }">
      <BaseButton
        responsive
        variant="outline"
        icon="👦🏻"
        text="設定學生"
        @click.stop="openEnrollmentModal(item)"
      />
      <BaseButton
        responsive
        variant="outline"
        icon="📄"
        text="複製"
        @click.stop="openCopy(item)"
      />
    </template>
    <template #form="{ form, setForm, updateField, errorFields, save, close }">
      <CourseForm
        :modelValue="form"
        @update:modelValue="setForm"
        :updateField="updateField"
        :errorFields="errorFields"

        @save="save"
        @close="close"
      />
    </template>
  </BaseManager>
  
  <CourseEnrollmentModal
    v-model:isOpen="isEnrollmentModalOpen"
    :course="currentCourseForEnrollment"
    @close="isEnrollmentModalOpen = false"
  />
</template>
