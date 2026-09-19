import { baseFields } from './baseSchemas'
import { importHolidays } from '@/modules/admin/holidayService'
import { formatDatePeriod } from '@/utils/formatters'
import { defineOrgSchema } from './schemaFactory'

export const uiPresets = {
  basic: {
    toolbar: { create: true, search: true, import: false, export: false, filters: [] },
    batchActions: ['delete', 'restore']
  },
  importable: {
    toolbar: { create: true, search: true, import: true, export: false, filters: [] },
    batchActions: ['delete', 'restore']
  }
}

export const settingsSchema = {
  semesters: defineOrgSchema('semesters', {
    idPrefix: 'sme_',
    registerInSettings: true,
    meta: { title: '學期與課程週期' },
    fields: {
      name: { default: '', type: 'text', label: '學期名稱', required: true },
      period: {
        default: { start: '', end: '' },
        type: 'custom',
        label: '期間',
        component: 'DatePeriod',
        format: (v) => formatDatePeriod(v, 'range'),
        showInTable: true,
        span: 2
      }
    }
  }),

  holidays: defineOrgSchema('holidays', {
    idPrefix: 'h_',
    registerInSettings: true,
    meta: { title: '假日設定' },
    pagination: true,
    fields: {
      type: {
        default: 'national',
        type: 'select',
        label: '假日類型',
        required: true,
        options: [
          { label: '國定假日', value: 'national' },
          { label: '補假', value: 'makeup' },
          { label: '自訂停課', value: 'custom' },
          { label: '其他', value: 'other' }
        ]
      },
      name: { default: '', type: 'text', label: '假日名稱', required: true },
      date: { default: '', type: 'date', label: '假日日期', required: true }
    },
    importConfig: {
      enabled: true,
      handler: importHolidays,
      params: {
        year: { type: 'number', label: '年份', default: new Date().getFullYear() }
      }
    },
    ui: uiPresets.importable
  }),

  campuses: defineOrgSchema('campuses', {
    idPrefix: 'camp_',
    registerInSettings: true,
    meta: { title: '校區管理' },
    labelKey: 'name',
    fields: {
      name: { default: '', type: 'text', label: '名稱', required: true },
      address: { default: '', type: 'text', label: '地址' },
      phone: { default: '', type: 'text', label: '電話' },
      isMain: { default: false, type: 'boolean', label: '主校區' }
    },
    ui: uiPresets.importable
  }),

  feeItems: defineOrgSchema('feeItems', {
    idPrefix: 'f_',
    registerInSettings: true,
    meta: { title: '收費項目' },
    fields: {
      name: { default: '', type: 'text', label: '名稱', required: true },
      defaultAmount: { default: 0, type: 'number', label: '金額', required: true },
      isEditable: { default: true, type: 'checkbox', label: '可修改' },
      isRequired: { default: false, type: 'checkbox', label: '必填' }
    }
  }),

  staffs: defineOrgSchema('staffs', {
    idPrefix: 'st_',
    registerInSettings: true,
    meta: { title: '行政人員' },
    fields: {
      name: { default: '', type: 'text', label: '姓名', required: true },
      role: { default: '', type: 'text', label: '職位' }
    }
  })
}