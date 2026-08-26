<script setup>
import { migrateCampus } from '@/dev/fs_move'

const run = async () => {
  await migrateCampus()
}
</script>

<template>
  <div>
    <h1>Migration Test</h1>
    <button @click="run">Run Migration</button>
  </div>
</template>