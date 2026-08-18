import { createApp } from 'vue'
import Root from './Root.vue'
import router from './router'
import { useAuth } from '@/composables/useAuth'

import '@/styles/theme.css'
import '@/styles/sidebar.css'
import '@/styles/manager.css'
import '@/styles/accordion.css'
import '@/styles/billingStyle.css'
import '@/styles/toolbar.css'

const app = createApp(Root)

app.use(router)

// ⭐ 正確：在 app context 外初始化，但 router 要傳進去
const auth = useAuth(router)
auth.init()

app.mount('#app')