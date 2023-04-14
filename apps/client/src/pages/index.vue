<script setup lang="ts">
import { createGameEngine, type GameEngine } from '@/game-engine';

definePage({
  name: 'Home'
});

const socket = useSocket();
socket.connect();

socket.on('connect', () => {
  socket.on('update', payload => {
    engine?.updateState(payload);
  });
  socket.on('game-meta', async payload => {
    if (!container.value) return;
    engine = await createGameEngine({
      container: container.value,
      sessionId: socket.id,
      meta: payload,
      socket
    });
    const { canvas } = engine;
    container.value.appendChild(canvas as any);
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
  });
});

const container = ref<HTMLDivElement>();
let engine: GameEngine;

onUnmounted(() => {
  engine?.cleanup();
  document.body.style.overflow = '';
  document.body.style.height = '';
});
</script>

<template><div ref="container" class="container" /></template>

<style scoped>
.container {
  height: 100%;
  max-width: 100vw;
  background: #222;
}
</style>
