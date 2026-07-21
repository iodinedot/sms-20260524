<script setup>
import { ref } from 'vue';
import CourseEnrollmentModal from '@/modules/course/CourseEnrollmentModal.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseManager from '@/components/base/BaseManager.vue';
import { WEEKDAY_OPTIONS } from '@/constants/options'
import { useCourses } from '@/modules/course/useCourses'

// ⭐ 核心：統一入口（只寫一次）
const courseApi = (form, updateField) =>
  useCourses({ value: form }, updateField)

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
    <template #form-extra="{ form, updateField }">
      <div
        v-if="['weekly-by-lesson', 'weekly-total'].includes(form.billingType)"
        class="form-group col-2"
      >
        <label class="form-label">上課時間</label>
        <div class="schedule-list">
          <div
            v-for="(row, index) in form.schedules || []"
            :key="index"
            class="time-row"
          >
            <!-- 星期 -->
            <select
              :value="row.dayOfWeek"
              @change="courseApi(form, updateField)
                .updateSchedule(index, 'dayOfWeek', Number($event.target.value))"
              class="base-select"
            >
              <option
                v-for="opt in WEEKDAY_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>

            <!-- 開始時間 -->
            <input
              type="time"
              :value="row.startTime"
              @input="courseApi(form, updateField)
                .updateSchedule(index, 'startTime', $event.target.value)"
              class="base-input"
            />

            <!-- 結束時間 -->
            <input
              type="time"
              :value="row.endTime"
              @input="courseApi(form, updateField)
                .updateSchedule(index, 'endTime', $event.target.value)"
              class="base-input"
            />

            <BaseButton
              variant="outline"
              text="×"
              @click="courseApi(form, updateField).removeSchedule(index)"
            />
          </div>

          <BaseButton
            variant="primary"
            text="新增上課時段"
            @click="courseApi(form, updateField).addSchedule()"
          />

        </div>
      </div>
    </template>
  </BaseManager>
  
  <CourseEnrollmentModal
    v-model:isOpen="isEnrollmentModalOpen"
    :course="currentCourseForEnrollment"
    @close="isEnrollmentModalOpen = false"
  />
</template>
