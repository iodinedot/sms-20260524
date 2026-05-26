<script setup>
import { ref, onMounted } from 'vue'
import { useSettings } from '../composables/useSettings'
import { adminService } from '../services/adminService'
import SettingsListManager from '../components/SettingsListManager.vue'

const { settings, loadSettings } = useSettings()

const activeSection = ref(null)
const isSaving = ref(false)

onMounted(async () => {
  await loadSettings()
})

const toggleSection = (key) => {
  activeSection.value = activeSection.value === key ? null : key
}

const handleSave = async () => {
  isSaving.value = true
  try {
    await adminService.saveSettings(settings.value)
    alert('儲存成功')
  } catch (e) {
    console.error(e)
    alert('儲存失敗')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="admin-page">

    <!-- 校區 -->
    <div class="accordion-item">
      <div class="accordion-header" @click="toggleSection('campuses')">
        校區管理
      </div>

      <div v-if="activeSection === 'campuses'" class="accordion-body">
        <SettingsListManager
          v-model="settings.campuses"
          prefix="c_"
        />
      </div>
    </div>

    <!-- 老師 -->
    <div class="accordion-item">
      <div class="accordion-header" @click="toggleSection('teachers')">
        老師管理
      </div>

      <div v-if="activeSection === 'teachers'" class="accordion-body">
        <SettingsListManager
          v-model="settings.teachers"
          prefix="t_"
        />
      </div>
    </div>

    <!-- 費用 -->
    <div class="accordion-item">
      <div class="accordion-header" @click="toggleSection('feeItems')">
        費用項目
      </div>

      <div v-if="activeSection === 'feeItems'" class="accordion-body">
        <SettingsListManager
          v-model="settings.feeItems"
          prefix="f_"
        />
      </div>
    </div>

    <!-- 員工 -->
    <div class="accordion-item">
      <div class="accordion-header" @click="toggleSection('staffs')">
        行政人員
      </div>

      <div v-if="activeSection === 'staffs'" class="accordion-body">
        <SettingsListManager
          v-model="settings.staffs"
          prefix="s_"
        />
      </div>
    </div>

    <!-- 儲存 -->
    <div class="actions">
      <button @click="handleSave" :disabled="isSaving">
        {{ isSaving ? '儲存中...' : '儲存設定' }}
      </button>
    </div>

  </div>
</template>