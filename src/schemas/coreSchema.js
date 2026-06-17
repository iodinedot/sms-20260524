import { baseFields } from './baseSchemas'
import { BILLING_TYPE, GENDER_TYPE } from '@/constants/options'

export const coreSchema = {
    students: {
      idPrefix: 'stu_',
      searchable: true,
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
      }
    },
  
    courses: {
      idPrefix: 'cou_',
      searchable: true,
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
        name: { default: '', type: 'text', label: '課程名稱',
        required: true },
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
          span: 1
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
          type: 'array',
          label: '上課時間',
          showInForm: false   // render in CourseForm
        },
        period: {
          default: {
            start: '',
            end: '',
            label: ''
          },
          type: 'period',
          label: '期間',
          showInTable: false,
          span: 2 },
        isValid: {
          default: true,
          type: 'checkbox',
          label: '啟用',
          showInForm: false,
          showInTable: false 
        }
      },
      validate(form) {
        const errors = {}
    
        // 🔥 通用 required（不用每個欄位手寫）
        Object.entries(this.fields).forEach(([key, field]) => {
          if (field.required && !form[key]) {
            errors[key] = `${field.label}為必填`
          }
        })
    
        // 🔥 客製規則（只寫特殊的）
        if (form.maxStudents < 0) {
          errors.maxStudents = '人數不能小於 0'
        }
    
        return errors
      },
    
      beforeSave(form) {
        return {
          ...form,
          updatedAt: Date.now()
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