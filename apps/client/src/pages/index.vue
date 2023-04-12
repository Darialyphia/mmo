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
  socket.on('map', async payload => {
    if (!container.value) return;
    engine = await createGameEngine({
      container: container.value,
      sessionId: socket.id,
      gameWorld: { map: payload }
    });
    const { canvas } = engine;
    container.value.appendChild(canvas);
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

useEventListener('keydown', e => {
  switch (e.code) {
    case 'KeyW':
      socket.emit('move', 'up');
      return;
    case 'KeyS':
      socket.emit('move', 'down');
      return;
    case 'KeyA':
      socket.emit('move', 'left');
      return;
    case 'KeyD':
      socket.emit('move', 'right');
      return;
    default:
      return;
  }
});
</script>

<template><div ref="container" class="container" /></template>

<style scoped>
.container {
  height: 100%;
}
</style>
