<!-- SearchBar.vue -->
<template>
  <input
    type="text"
    class="base-input"
    :placeholder="placeholder || '搜尋...'"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
});
defineEmits(['update:modelValue']);
</script>
