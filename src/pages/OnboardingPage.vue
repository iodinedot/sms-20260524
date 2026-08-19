<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const { completeOnboarding } = useAuth()

const form = ref({ name: '', phone: '', address: '' })
const isSubmitting = ref(false)

const submit = async () => {
  isSubmitting.value = true
  try {
    await completeOnboarding(form.value)
    router.push('/app') // guard 會確認 status === 'ready' 後放行
  } catch (err) {
    console.error('[Onboarding] failed:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div style="padding: 40px; max-width: 500px;">
    <h2>建立補習班資料</h2>
    <input class="base-input" v-model="form.name" placeholder="補習班名稱" />
    <input class="base-input" v-model="form.phone" placeholder="電話" />
    <input class="base-input" v-model="form.address" placeholder="地址" />
    <BaseButton
      variant="primary"
      icon=""
      text="完成設定"
      @click="submit"
      responsive
      :disabled="isSubmitting"
    />
  </div>
</template>