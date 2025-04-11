<script setup lang="ts">

import { ref } from 'vue';
import PhaserGame from './game/PhaserGame.vue';
import { Game, Scene } from 'phaser';

const childRef = ref();
const scene: Scene = childRef.value.scene.value;
const game: Game = childRef.value.game.value;


</script>

<template>
    <PhaserGame ref="phaserRef" />
</template>