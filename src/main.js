// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// ⭐ 全域樣式（順序很重要）
import '@/styles/theme.css'
import '@/styles/sidebar.css'
import '@/styles/manager.css'
import '@/styles/accordion.css'
import '@/styles/billingStyle.css'
import '@/styles/toolbar.css'


createApp(App)
    .use(router)
    .mount('#app')