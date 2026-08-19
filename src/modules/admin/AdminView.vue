<script setup>
import { ref, computed } from 'vue'
import BaseManager from '@/components/base/BaseManager.vue'
import { settingsSchema } from '@/schemas/settingsSchema'

const activeSection = ref(null)

const toggleSection = (key) => {
  activeSection.value = activeSection.value === key ? null : key
}

const sections = computed(() =>
  Object.entries(settingsSchema).map(([key, cfg]) => ({
    key,
    title: cfg.meta?.title ?? key
  }))
)
</script>

<template>
  <div class="admin-page">
    <h2 class="page-title">行政項目設定</h2>

    <div
      v-for="section in sections"
      :key="section.key"
      class="accordion-card"
    >
      <div class="accordion-header" @click="toggleSection(section.key)">
        {{ section.title }}
      </div>
      <div v-if="activeSection === section.key" class="accordion-body">
        <BaseManager :type="section.key" />
      </div>
    </div>
  </div>
</template>