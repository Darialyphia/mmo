<script setup lang="ts">
defineOptions({
  name: 'DefaultLayout'
});
</script>

<template>
  <div class="default-layout">
    <header>Header</header>

    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions, vuejs-accessibility/mouse-events-have-key-events -->

    <main>
      <slot />
    </main>
    <footer>Footer</footer>
  </div>
</template>

<style scoped lang="postcss">
@import '@/styles/medias.css';

.default-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}
</style>
