// constant options.js
export const WEEKDAY_OPTIONS = [
    { label: '星期一', value: 1 },
    { label: '星期二', value: 2 },
    { label: '星期三', value: 3 },
    { label: '星期四', value: 4 },
    { label: '星期五', value: 5 },
    { label: '星期六', value: 6 },
    { label: '星期日', value: 7 }
  ]
export const BILLING_TYPE = [
  { label: '每週固定上課-堂數計費', value: 'weekly-by-lesson' },
  { label: '每週固定上課-學期計費', value: 'weekly-total' },
  { label: '區間課程', value: 'period-total' }
]

export const GENDER_TYPE = [
  { label: '男', value: 'M' },
  { label: '女', value: 'F' }
]


export const getBillingTypeLabel = (value) => {
  return BILLING_TYPE.find(i => i.value === value)?.label || value
}