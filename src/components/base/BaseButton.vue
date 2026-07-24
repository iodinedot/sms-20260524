<script setup>
const props = defineProps({
  text: String,
  icon: String,
  variant: {
    type: String,
    default: 'primary' // primary / danger / success / outline
  },
  mode: {
    type: String,
    default: 'full' // full / icon / text
  },
  responsive: Boolean,
  disabled: Boolean
})
</script>

<template>
  <button
    class="btn"
    :class="[
      `btn-${variant}`,
      {
        'icon-only': mode === 'icon',
        'text-only': mode === 'text',
        'is-responsive': responsive,
        'is-disabled': disabled
      }
    ]"
    :disabled="disabled"
  >
    <span v-if="mode !== 'text' && icon" class="btn-icon">
      {{ icon }}
    </span>

    <span v-if="mode !== 'icon' && text" class="btn-text">
      {{ text }}
    </span>
  </button>
</template>