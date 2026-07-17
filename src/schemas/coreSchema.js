import { baseFields } from './baseSchemas'
import { BILLING_TYPE, GENDER_TYPE } from '@/constants/options'
import { formatDatePeriod, formatTimePeriodArray } from '@/utils/formatters'

export const coreSchema = {
    students: {
      idPrefix: 'stu_',
      title:'學生資料設定',
      emptyText:'目前暫無學生資料，請點擊右上方新增。',
    
      pagination: true,
  
      fields: {
        ...baseFields,
        campusId: { default: '', type: 'select', label: '校區', optionsKey: 'campuses' },
        chName: { default: '', type: 'text', label: '中文姓名', required: true, span: 1 },
        enName: { default: '', type: 'text', label: '英文姓名', span: 1 },
        gender: { default: '', type: 'select', label: '性別', span: 1,
          options: GENDER_TYPE
        },
        grade: { default: '', type: 'text', label: '年級', span: 1 },
        parentName: { default: '', type: 'text', label: '家長姓名', showInTable: false, span: 1 },
        parentPhone: { default: '', type: 'text', label: '家長電話', showInTable: false, span: 1 },
        siblingIds: {
          default: [], type: 'array', label: '兄弟姊妹',
          showInForm: false, 
          showInTable: false },
        note: {
          default: '',
          type: 'textarea',
          label: '備註', showInTable: false 
        },
      },
      searchFields: [
        'chName',
        'enName',
        'campusId'
      ],
      ui: {
        toolbar: {
          create: true,
          search: true,
          import: false,
          export: false,
          filters: [
            'campusId',
            'grade',
            'status'
          ]
        },
      
        batchActions: [
          'delete',
          'restore'
        ]
      }
    },
  
    courses: {
      idPrefix: 'cou_',
      title: '課程資料設定',
      emptyText: '目前暫無課程資料，請點擊右上方新增。',
      pagination: true,
  
      fields: {
        ...baseFields,
        campusId: {
          default: '',
          type: 'select',
          label: '校區', 
          optionsKey: 'campuses',
          span: 2
        },
        name: { 
          default: '',
          type: 'text',
          label: '課程名稱',
          required: true
        },
        description: {
          default: '',
          type: 'textarea',
          label: '描述', 
          showInTable: false 
        },
        maxStudents: {
          default: 10,
          type: 'number',
          label: '人數上限',
          showInTable: false,
          span: 1,
          min: 0
        },
        teacherId: {
          default: '',
          type: 'select',
          label: '授課教師',
          optionsKey: 'teachers',
          span: 1 
        },
        billingType: {
          default: 'weekly-by-lesson', 
          type: 'select', 
          label: '上課/計費方式',
          options: BILLING_TYPE, 
          showInTable: false,
          span: 1
        },
        unitPrice: {
          default: 0,
          type: 'number',
          label: '單價',
          showInTable: false,
          span: 1,
          showIf: (model) => model.billingType === 'weekly-by-lesson'
        },
        fixedTotalAmount: {
          default: 0,
          type: 'number',
          label: '總價',
          showInTable: false,
          span: 1,
          showIf: (model) =>
          model.billingType === 'weekly-total' ||
          model.billingType === 'period-total'
        },
        schedules: {
          default: [],
          type: 'custom',
          label: '上課時間',
          component: 'TimePeriodArray',
          format: (v) => formatTimePeriodArray(v, 'range'),
          required: true,
          showInForm: false   // render in CourseForm
        },
        period: {
          default: {},
          type: 'custom',
          label: '期間',
          component: 'DatePeriod',
          format: (v) => formatDatePeriod(v, 'range'),
          showInTable: false,
          span: 2 
        },
        isValid: {
          default: true,
          type: 'checkbox',
          label: '啟用',
          showInForm: false,
          showInTable: false 
        }
      },
    
      searchFields: [
        'name',
        'teacherId',
        'campusId'
      ],
      
      validate: (form) => {
        console.log('validating course editing...', form.billingType)
        const errors = {}
      
        // 🔥 只有這兩種才檢查
        if (form.billingType !== 'weekly-by-lesson') {
          if (!form.fixedTotalAmount || form.fixedTotalAmount < 1) {
            errors.fixedTotalAmount = '總價需 ≥ 1'
          }
        } else {
          if (!form.unitPrice || form.unitPrice < 1) {
            errors.unitPrice = '單價需 ≥ 1'
          }
        }
      
        return errors
      },

      beforeSave(form) {
        return {
          ...form,
          updatedAt: Date.now()
        }
      },

      ui: {
        toolbar: {
          create: true,
          search: true,
          import: false,
          export: false,
          filters: [
            'campusId'
          ]
        },

        batchActions: [
          'delete',
          'restore'
        ]
      }
    },
  
    enrollments: {
      idPrefix: 'enr_',
      pagination: true,
  
      fields: {
        studentId: {
          default: null,
          type: 'text',
          label: '學生'
        },
        courseId: { default: null, type: 'text', label: '課程'
        },
        /*status: { default: 'active', type: 'select', label: '狀態',
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
        }*/
      }
    }
  }