<script setup>
import { ref } from 'vue'
import BaseManager from '@/components/base/BaseManager.vue';

const activeSection = ref(null)

const toggleSection = (key) => {
  activeSection.value = activeSection.value === key ? null : key
}
</script>

<template>
  <div class="admin-page">
    <h2 class="page-title">行政項目設定</h2>
    <!-- 學期 -->
    <div class="accordion-card">
      <div class="accordion-header" @click="toggleSection('semesters')">學期設定</div>
      <div v-if="activeSection === 'semesters'" class="accordion-body">
        <BaseManager type="semesters" />
      </div>
    </div>

    <!-- 假日 -->
    <div class="accordion-card">
      <div class="accordion-header" @click="toggleSection('holidays')">假日設定</div>
      <div v-if="activeSection === 'holidays'" class="accordion-body">
        <BaseManager type="holidays" />
      </div>
    </div>

    <!-- 費用 -->
    <div class="accordion-card">
      <div class="accordion-header" @click="toggleSection('feeItems')">費用項目</div>
      <div v-if="activeSection === 'feeItems'" class="accordion-body">
        <BaseManager type="feeItems" />
      </div>
    </div>

    <!-- 老師 -->
    <div class="accordion-card">
      <div class="accordion-header" @click="toggleSection('teachers')">老師管理</div>
      <div v-if="activeSection === 'teachers'" class="accordion-body">
        <BaseManager type="teachers" />
      </div>
    </div>

    <!-- 員工 -->
    <div class="accordion-card">
      <div class="accordion-header" @click="toggleSection('staffs')">行政人員</div>
      <div v-if="activeSection === 'staffs'" class="accordion-body">
        <BaseManager type="staffs" />
      </div>
    </div>

    <!-- 校區 -->
    <div class="accordion-card">
      <div class="accordion-header" @click="toggleSection('campuses')">校區管理</div>
      <div v-if="activeSection === 'campuses'" class="accordion-body">
        <BaseManager type="campuses" />
      </div>
    </div>
  </div>
</template>