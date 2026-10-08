// main.js
import { createApp } from 'vue'
import Root from './Root.vue'
import router from './router'
import { useAuth } from '@/composables/useAuth'
import { initGlobalSubscriptions } from '@/bootstrap/initGlobalSubscriptions'

import '@/styles/theme.css'
import '@/styles/sidebar.css'
import '@/styles/manager.css'
import '@/styles/accordion.css'
import '@/styles/billingStyle.css'
import '@/styles/toolbar.css'

const app = createApp(Root)

app.use(router)

// main.js
const auth = useAuth(router)
auth.init()
app.mount('#app')

auth.waitUntilResolved().then(() => {
  if (auth.user.value) {
    initGlobalSubscriptions()
  }
})