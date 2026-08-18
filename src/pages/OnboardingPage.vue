<script setup>
import { ref } from 'vue'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useRouter } from 'vue-router'

const router = useRouter()

// 👉 暫時寫死 orgId（之後從 auth 帶進來）
const orgId = 'HAfhVOsXK9p1J9MZJiFg'

const form = ref({
  name: '',
  phone: '',
  address: ''
})

const submit = async () => {
  await setDoc(
    doc(db, 'organizations', orgId),
    {
      ...form.value,
      isSetupComplete: true,
      createdAt: serverTimestamp()
    },
    { merge: true }
  )

  console.log('[Onboarding] completed')

  router.push('/app/billing')
}
</script>

<template>
  <div style="padding: 40px; max-width: 500px;">
    <h2>建立補習班資料</h2>

    <input v-model="form.name" placeholder="補習班名稱" />
    <input v-model="form.phone" placeholder="電話" />
    <input v-model="form.address" placeholder="地址" />

    <button @click="submit">
      完成設定
    </button>
  </div>
</template>