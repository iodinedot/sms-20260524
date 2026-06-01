export const coreSchema = {
    students: {
      idPrefix: 'stu_',
      searchable: true,
      pagination: true,
  
      fields: {
        chName: { default: '', type: 'text', label: '中文姓名', required: true },
        enName: { default: '', type: 'text', label: '英文姓名' },
        campusId: { default: '', type: 'select', label: '校區', optionsKey: 'campuses' },
        grade: { default: '', type: 'text', label: '年級' },
        parentName: { default: '', type: 'text', label: '家長姓名' },
        parentPhone: { default: '', type: 'text', label: '家長電話' },
        gender: { default: '', type: 'select', label: '性別',
          options: [
            { label: '男', value: 'M' },
            { label: '女', value: 'F' }
          ]
        },
        siblingIds: { default: [], type: 'array', label: '兄弟姊妹' }
      }
    },
  
    courses: {
      idPrefix: 'cou_',
      searchable: true,
      pagination: true,
  
      fields: {
        name: {
          default: '',
          type: 'text',
          label: '課程名稱',
          required: true
        },
        campusId: {
          default: '',
          type: 'text',
          label: '校區'
        },
        billingType: {
          default: 'fixed-weekly',
          type: 'select',
          label: '計費方式',
          options: [
            { label: '固定週', value: 'fixed-weekly' },
            { label: '固定學期', value: 'fixed-semester' },
            { label: '固定區間', value: 'fixed-period' }
          ]
        },
        description: {
          default: '',
          type: 'text',
          label: '描述'
        },
        maxStudents: {
          default: 10,
          type: 'number',
          label: '人數上限'
        },
        teacherId: {
          default: '',
          type: 'text',
          label: '老師'
        },
        unitPrice: {
          default: 0,
          type: 'number',
          label: '單價'
        },
        isCalculatedByTotal: {
          default: false,
          type: 'checkbox',
          label: '是否總價計算'
        },
        fixedTotalAmount: {
          default: 0,
          type: 'number',
          label: '總價'
        },
        schedules: {
          default: [],
          type: 'array',
          label: '上課時間'
        },
        startDate: {
          default: '',
          type: 'date',
          label: '開始日期'
        },
        endDate: {
          default: '',
          type: 'date',
          label: '結束日期'
        },
        isValid: {
          default: true,
          type: 'checkbox',
          label: '啟用'
        }
      }
    },
  
    enrollments: {
      idPrefix: 'enr_',
      searchable: true,
      pagination: true,
  
      fields: {
        studentId: {
          default: null,
          type: 'text',
          label: '學生'
        },
        courseId: {
          default: null,
          type: 'text',
          label: '課程'
        },
        status: {
          default: 'active',
          type: 'select',
          label: '狀態',
          options: [
            { label: '就讀中', value: 'active' },
            { label: '暫停', value: 'paused' },
            { label: '結束', value: 'completed' }
          ]
        },
        createdAt: {
          default: () => new Date().toISOString(),
          type: 'text'
        },
        updatedAt: {
          default: () => new Date().toISOString(),
          type: 'text'
        }
      }
    }
  }