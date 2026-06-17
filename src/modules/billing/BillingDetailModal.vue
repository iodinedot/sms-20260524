<script setup>
defineProps({
  isOpen: Boolean,
  billing: Object
})

const emit = defineEmits(['update:isOpen'])
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>帳單詳細</h3>
        <BaseButton variant="outline" text="×" @click="closeModal" class="close-x" />
      </div>

      <div class="modal-body">
      
      {{ billing }}
      </div>

      <button @click="emit('update:isOpen', false)">關閉</button>
    </div>
  </div>
</template>