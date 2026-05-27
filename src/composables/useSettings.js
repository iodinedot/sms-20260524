// composables/useSettings.js
import { ref, watch } from 'vue'
import { adminService } from '../services/adminService'

const settings = ref(null)
const maps = ref({})   // 🔥 所有 map 集中
let loaded = false

// 🔥 自動建立所有 map
const buildAllMaps = (data) => {
  maps.value = {
    campuses: buildMap(data.campuses || []),
    teachers: buildMap(data.teachers || []),
    courseCategories: buildMap(data.courseCategories || []),
    feeItems: buildMap(data.feeItems || []),
    staffs: buildMap(data.staffs || []),
  }
}

export function useSettings() {
  const loadSettings = async () => {
    if (loaded) return
    settings.value = await adminService.getSettings()
    buildAllMaps(settings)
    loaded = true
  }
  
  const saveSettings = async () => {
    await adminService.saveSettings(settings.value)
  }

  watch(
    settings,
    (newVal) => {
      if (!newVal) return
      buildAllMaps(newVal)
    },
    { deep: true }
  )
  // 🔥 通用 API（核心）
  const getName = (type, id) => {
    return maps.value?.[type]?.[String(id)] || '-'
  }

  // 🔥 專用 API（給 UI 用）
  const getCampusName = (id) => getName('campuses', id)
  const getTeacherName = (id) => getName('teachers', id)
  const getCourseCategoryName = (id) => getName('courseCategories', id)

  return {
    settings,
    maps,
    loadSettings,
    saveSettings,

    // 🔥 API
    getName,
    getCampusName,
    getTeacherName,
    getCourseCategoryName,
  }
}

function buildMap(list = []) {
  const map = {}

  list.forEach(item => {
    map[String(item.id)] = item.name
  })

  return map
}