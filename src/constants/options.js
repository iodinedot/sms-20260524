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


export const GENDER_TYPE = [
  { label: '男', value: 'M' },
  { label: '女', value: 'F' }
]

export const BILLING_TYPE = [
  { label: '每週固定上課-堂數計費', value: 'weekly-by-lesson' },
  { label: '每週固定上課-學期計費', value: 'weekly-total' },
  { label: '區間課程', value: 'period-total' }
]

export const getBillingTypeLabel = (value) => {
  return BILLING_TYPE.find(i => i.value === value)?.label || value
}

export const BILLING_STATUS_OPTIONS = [
  { label: '草稿', value: 'draft', color: 'gray' },
  { label: '已開單', value: 'issued', color: 'blue' },
  { label: '部分付款', value: 'partial', color: 'orange' },
  { label: '已付款', value: 'paid', color: 'green' },
  { label: '作廢', value: 'void', color: 'red' }
]

export const getBillingStatusMeta = (value) => {
  return BILLING_STATUS_OPTIONS.find(i => i.value === value) || {
    label: value,
    value,
    color: 'gray'
  }
}

export const BILLING_STATUS_GROUPS = [
  { label: '全部', value: 'all' },
  { label: '待收款', value: 'pending', includes: ['issued', 'partial'] },
  { label: '已收款', value: 'paid', includes: ['paid'] },
  { label: '草稿', value: 'draft', includes: ['draft'] },
  { label: '作廢', value: 'void', includes: ['void'] }
]