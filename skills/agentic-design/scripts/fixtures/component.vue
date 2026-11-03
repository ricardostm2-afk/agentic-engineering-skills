<template>
  <section class="empty">
    <p>No results for "{{ term }}". Try another title or catalogue number.</p>
  </section>
</template>
<script setup>
// ✨ script comments do not count
const term = "The Lighthouse";
</script>
<style scoped>
.empty { font-size: 14px; color: var(--color-fg); }
</style>
