<script setup>
import { ref, onMounted, computed } from 'vue'
import { studentService } from '../services/studentService'
import { enrollmentService } from '../services/enrollmentService'
import { useSettings } from '../composables/useSettings'
import SearchBar from '../components/SearchBar.vue';
import BaseButton from '../components/BaseButton.vue';

const props = defineProps({
  isOpen: Boolean,
  course: Object
})

const emit = defineEmits([
  'update:isOpen',
  'close',
  'success'
])

const students = ref([])
const enrollments = ref([])
const selectedIds = ref(new Set())
const courseSearchQuery = ref('')
const statusFilter = ref('all') // all / active / not_active

const { getCampusName } = useSettings()

// 🔥 1. 載入資料
onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  students.value = await studentService.getStudentsByCampus(
    props.course.campusId
  )

  enrollments.value = await enrollmentService.getByCourse(
    props.course.id
  )

  selectedIds.value = new Set(
    enrollments.value
      .filter(e => e.status === 'active')
      .map(e => e.studentId)
  )
}

// 🔥 2. 建立 Map（加速查詢）
const enrollmentMap = computed(() => {
  const map = new Map()
  enrollments.value.forEach(e => {
    map.set(e.studentID, e)
  })
  return map
})

// 🔥 3. 合併資料（給 UI 用）
const mergedStudents = computed(() => {
  return students.value.map(student => {
    const enrollment = enrollmentMap.value.get(student.id)

    return {
      ...student,
      courseStatus: enrollment?.status || 'none',
      checked: selectedIds.value.has(student.id)
    }
  })
})

const filteredStudents = computed(() => {
  let list = mergedStudents.value

  // 🔹 狀態篩選
  if (statusFilter.value === 'active') {
    list = list.filter(s => s.courseStatus === 'active')
  } else if (statusFilter.value === 'not_active') {
    list = list.filter(s => s.courseStatus !== 'active')
  }

  // 🔹 搜尋
  if (!courseSearchQuery.value.trim()) return list

  const keyword = courseSearchQuery.value.toLowerCase()

  return list.filter(s =>
    (s.chName || '').toLowerCase().includes(keyword)
  )
})

// 🔥 4. 勾選切換
const toggleStudent = (id) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = newSet   // 🔥 這行是關鍵
}

const isSaving = ref(false)
// 🔥 5. 儲存
const handleSave = async () => {
  try {
    isSaving.value = true

    await enrollmentService.updateCourseStudents(
      props.course.id,
      Array.from(selectedIds.value) // ⚠️ Set → Array
    )

    emit('saved')
    emit('update:isOpen', false)

  } finally {
    isSaving.value = false
  }
}

const closeModal = () => {
  emit('update:isOpen', false);
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="page-title" style="margin: 0; flex: 1">
          （{{ getCampusName(course.campusId) }}）{{ course.name }} - 學生管理
        </h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>
      <div class="modal-body">
        <div class="form-group">
          <SearchBar
            v-model="courseSearchQuery"
            placeholder="輸入關鍵字搜尋..."
          />
          <select v-model="statusFilter" class="base-select width-auto">
            <option value="all">全部</option>
            <option value="active">已修課</option>
            <option value="not_active">未修課</option>
          </select>
          <div class="status-bar">
            <span class="text-small" v-if="statusFilter.trim() !== ''">
              🔍 找到 {{ filteredStudents.length }} 筆結果
            </span>
            <span v-if="selectedIds.size > 0" class="text-small">
              已選 <strong>{{ selectedIds.size }} </strong> 人
            </span>
          </div>
        </div>

        <table class="table-card">
          <thead>
            <tr>
              <th>選擇</th>
              <th>姓名</th>
              <th>狀態</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="s in filteredStudents"
              :key="s.id"
              style="cursor: pointer;"
            >
              <td @click.stop="toggleStudent(s.id)">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(s.id)"
                  readonly
                />
              </td>
              <td @click="toggleStudent(s.id)">
                {{ s.chName }}
              </td>
              <td>
                <span v-if="selectedIds.has(s.id)">已修課</span>
                <span v-else>未修課</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <BaseButton
          variant="outline" 
          text="取消" 
          @click="closeModal" 
          :disabled="isSaving" 
        />
      
        <BaseButton
          responsive
          variant="primary"
          icon="✓"
          :text="isSaving ? '儲存中...' : '儲存變更'"
          :disabled="isSaving"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>