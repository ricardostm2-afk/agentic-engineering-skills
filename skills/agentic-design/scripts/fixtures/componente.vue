<template>
  <section class="vazio">
    <p>Sem resultados para «{{ termo }}». Experimente outro nome ou o NIF.</p>
  </section>
</template>
<script setup>
// ✨ comentário de script não conta
const termo = "Ana";
</script>
<style scoped>
.vazio { font-size: 14px; color: var(--color-fg); }
</style>
