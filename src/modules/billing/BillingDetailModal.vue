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
      <h3>帳單詳細</h3>

      <pre>{{ billing }}</pre>

      <button @click="emit('update:isOpen', false)">關閉</button>
    </div>
  </div>
</template>