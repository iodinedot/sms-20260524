// composables/useSettings.js
import { ref } from 'vue'
import { adminService } from '../services/adminService'

const settings = ref(null)
const maps = ref({})   // 🔥 所有 map 集中
let loaded = false

export function useSettings() {

  const loadSettings = async () => {
    if (loaded) return

    const data = await adminService.getSettings()
    settings.value = data

    // 🔥 自動建立所有 map
    maps.value = {
      campuses: buildMap(data.campuses),
      teachers: buildMap(data.teachers),
      courseCategories: buildMap(data.courseCategories),
      feeItems: buildMap(data.feeItems),
      staffs: buildMap(data.staffs),
    }

    loaded = true
  }

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