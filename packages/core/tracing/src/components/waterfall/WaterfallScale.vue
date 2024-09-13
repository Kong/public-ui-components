<template>
  <div class="waterfall-scale">
    <div
      v-for="(_, tick) in config.ticks - 1"
      :key="`tick-${tick}`"
      class="scale-segment"
    >
      <div class="scale-tick-label">
        {{ format(durationShift + tick * durationPerTick) }}
      </div>
      <div
        v-if="tick === config.ticks - 2"
        class="scale-tick-label"
      >
        {{ format(durationShift + (tick + 1) * durationPerTick) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import composables from '../../composables'
import { WATERFALL_CONFIG } from '../../constants'
import type { WaterfallConfig } from '../../types'

const format = composables.useDurationFormatter()

const config = inject<WaterfallConfig>(WATERFALL_CONFIG)!

const durationPerTick = computed(() => config.totalDurationNano * (1 - config.viewport.left - config.viewport.right) / (config.ticks - 1))

// RESERVED: Only used when zooming is enabled
const durationShift = computed(() => config.totalDurationNano * config.viewport.left)
</script>

<style lang="scss" scoped>
.waterfall-scale {
  display: grid;
  grid-template-columns: v-bind("`repeat(${(config.ticks - 1)}, 1fr)`");
  height: 24px;
  position: relative;

  .scale-segment {
    $tick-height: 6px;
    align-items: flex-end;
    border-bottom: 1px solid black;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    justify-content: center;
    padding-bottom: 0;
    position: relative;

    &::before {
      border-left: 1px solid black;
      bottom: 0;
      content: "";
      height: $tick-height;
      left: 0;
      position: absolute;
    }

    &:last-child {
      &::after {
        border-left: 1px solid black;
        bottom: 0;
        content: "";
        height: $tick-height;
        position: absolute;
        right: 0;
      }
    }

    .scale-tick-label {
      bottom: $tick-height;
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-10;
      line-height: $kui-line-height-20;
      position: absolute;

      &:nth-child(1) {
        left: 0;
      }

      &:nth-child(2) {
        right: 0;
      }
    }

    &:not(:first-child) {
      .scale-tick-label:nth-child(1) {
        transform: translateX(-50%);
      }
    }
  }
}
</style>
