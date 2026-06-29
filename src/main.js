// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/theme.css' // 匯入全域樣式
import router from './router'

//import '@/dev/testBilling' // test billing

createApp(App)
    .use(router)
    .mount('#app')