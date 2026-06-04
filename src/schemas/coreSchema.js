import { BILLING_TYPE, GENDER_TYPE } from '@/constants/options'

export const coreSchema = {
    students: {
      idPrefix: 'stu_',
      searchable: true,
      pagination: true,
  
      fields: {
        campusId: { default: '', type: 'select', label: '校區', optionsKey: 'campuses' },
        chName: { default: '', type: 'text', label: '中文姓名', required: true },
        enName: { default: '', type: 'text', label: '英文姓名' },
        gender: { default: '', type: 'select', label: '性別',
          options: GENDER_TYPE
        },
        grade: { default: '', type: 'text', label: '年級' },
        parentName: { default: '', type: 'text', label: '家長姓名', showInTable: false },
        parentPhone: { default: '', type: 'text', label: '家長電話', showInTable: false },
        siblingIds: { default: [], type: 'array', label: '兄弟姊妹', render: false, showInTable: false }
      }
    },
  
    courses: {
      idPrefix: 'cou_',
      searchable: true,
      pagination: true,
  
      fields: {
        campusId: { default: '',
          type: 'select', label: '校區', 
          optionsKey: 'campuses', span: 1
        },
        name: { default: '', type: 'text', label: '課程名稱',
        required: true },
        description: {
          default: '',
          type: 'textarea',
          label: '描述', showInTable: false 
        },
        maxStudents: {
          default: 10,
          type: 'number',
          label: '人數上限',
          showInTable: false,
          span: 1
        },
        teacherId: { default: '', type: 'select', label: '授課教師', optionsKey: 'teachers',
        span: 1 },
        billingType: {
          default: 'fixed-weekly', type: 'select', label: '上課/計費方式', options: BILLING_TYPE, showInTable: false,
          span: 1
        },
        unitPrice: {
          default: 0,
          type: 'number',
          label: '單價',
          showInTable: false,
          span: 1,
          showIf: (model) => model.billingType === 'fixed-weekly'
        },
        fixedTotalAmount: {
          default: 0,
          type: 'number',
          label: '總價',
          showInTable: false,
          span: 1,
          showIf: (model) =>
          model.billingType === 'fixed-semester' ||
          model.billingType === 'fixed-period'
        },
        schedules: {
          default: [],
          type: 'array',
          label: '上課時間',
          render: false   // render in CourseForm
        },
        startDate: {
          default: '',
          type: 'date',
          label: '開始日期',
          showInTable: false,
          span: 1
        },
        endDate: { default: '', type: 'date', label: '結束日期', showInTable: false,
        span: 1 },
        isValid: {
          default: true,
          type: 'checkbox',
          label: '啟用',
          render: false,
          showInTable: false 
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
        courseId: { default: null, type: 'text', label: '課程'
        },
        status: { default: 'active', type: 'select', label: '狀態',
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