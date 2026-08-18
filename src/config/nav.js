const BASE = '/app'

export const navItems = [
  {
    key: 'courses',
    label: '課程資料',
    icon: '📚',
    path: `${BASE}/courses`
  },
  {
    key: 'students',
    label: '學生資料',
    icon: '👤',
    path: `${BASE}/students`
  },
  {
    key: 'billing',
    label: '繳費單業務',
    icon: '💰',
    path: `${BASE}/billing`
  },
  {
    key: 'admin',
    label: '行政項目設定',
    icon: '⚙️',
    path: `${BASE}/admin`
  }
]