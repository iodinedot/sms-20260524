<script setup>
import BaseButton from '../components/BaseButton.vue';

defineProps({
  open: Boolean,
  data: Array
})

const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <div v-show="open" class="modal-overlay">
    <div class="modal-content">

      <h3>匯入預覽（{{ data.length }} 筆）</h3>

      <div v-if="data.length === 0">
        沒有可匯入資料
      </div>

      <div v-else class="modal-body">
        <div
          v-for="item in data"
          :key="item.date"
          class="preview-item"
        >
          {{ item.date }} - {{ item.name }}
        </div>
      </div>

      <div class="modal-footer">
        <BaseButton @click="$emit('confirm')" text="確認" />
        <BaseButton variant="outline" @click="$emit('close')" text="取消"/>
      </div>

    </div>
  </div>
</template>