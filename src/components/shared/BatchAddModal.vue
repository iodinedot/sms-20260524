<script setup>
import BaseButton from '@/components/base/BaseButton.vue'
defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: String, default: '' },
  result: { type: Object, default: null } // { successCount, failed: [{ line, error }] }
})

defineEmits(['update:modelValue', 'submit', 'close'])
</script>

<template>
  <div v-if="open" class="modal">
    <div class="batch-add-panel">
      <h4>批次新增</h4>
      <p class="hint">一行輸入一筆</p>

      <div v-if="result" class="batch-result">
        <p>成功 {{ result.successCount }} 筆，失敗 {{ result.failed.length }} 筆：</p>
        <ul>
          <li v-for="(f, idx) in result.failed" :key="idx">
            {{ f.line }} — {{ f.error }}
          </li>
        </ul>
        <p class="hint">失敗的項目已保留在下方，可修改後重新送出。</p>
      </div>

      <textarea
        :value="modelValue"
        rows="10"
        placeholder="例如：&#10;王小明&#10;林小華&#10;陳小美"
        @input="$emit('update:modelValue', $event.target.value)"
      ></textarea>

      <div class="modal-actions">
        <BaseButton text="取消" variant="outline" @click="$emit('close')" />
        <BaseButton text="送出" @click="$emit('submit')" />
      </div>
    </div>
  </div>
</template>