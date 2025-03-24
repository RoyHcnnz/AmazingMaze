<script setup lang="ts">
import Phaser from 'phaser';
import { ref, toRaw } from 'vue';
import PhaserGame from './game/PhaserGame.vue';


</script>

<template>
    <PhaserGame ref="phaserRef" />
</template>