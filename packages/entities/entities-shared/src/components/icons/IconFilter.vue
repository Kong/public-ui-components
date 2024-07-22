<template>
  <svg
    fill="none"
    height="20"
    viewBox="0 0 20 20"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <mask
      id="mask0_180_20349"
      height="20"
      maskUnits="userSpaceOnUse"
      style="mask-type:alpha"
      width="20"
      x="0"
      y="0"
    >
      <rect
        :fill="color"
        height="20"
        width="20"
      />
    </mask>
    <g mask="url(#mask0_180_20349)">
      <path
        d="M8 14.5V13H12V14.5H8ZM5 10.75V9.25H15V10.75H5ZM3 7V5.5H17V7H3Z"
        :fill="color"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { KUI_COLOR_BACKGROUND_PRIMARY } from '@kong/design-tokens'
defineProps({
  color: {
    type: String,
    default: `var(--kong-ui-entity-filter-color, ${KUI_COLOR_BACKGROUND_PRIMARY})`,
  },
})
</script>
