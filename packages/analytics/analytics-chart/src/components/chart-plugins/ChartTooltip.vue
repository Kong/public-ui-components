<template>
  <div
    v-if="showTooltip"
    ref="tooltipEl"
    class="tooltip-container"
    :style="{ left, top }"
  >
    <ul
      class="tooltip"
    >
      <li class="tooltip-title">
        <span class="title font-bold">{{ tooltipTitle }}</span>
        <span
          v-if="context"
          class="subtitle"
        >{{ context }}</span>
      </li>
      <template
        v-for="{ backgroundColor, borderColor, label, value } in (series as any)"
        :key="label"
      >
        <li v-if="series.length">
          <div
            class="tooltip-legend"
            :style="{ background: backgroundColor, 'border-color': borderColor }"
          />
          <span class="display-label">{{ label }}</span>
          <span class="display-value">{{ value }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const emit = defineEmits(['dimensions'])

defineProps({
  showTooltip: {
    type: Boolean,
    required: true,
    default: false,
  },
  /**
   * The left position relative to the chart
   * eg. '10px'
   */
  left: {
    type: String,
    required: false,
    default: null,
  },
  /**
   * The top position relative to the chart
   */
  top: {
    type: String,
    required: false,
    default: null,
  },
  /**
   * Tooltip title
   */
  tooltipTitle: {
    type: String,
    required: false,
    default: '',
  },
  /**
   * X axes value under cursor
   */
  context: {
    type: [String, Number],
    required: false,
    default: '',
  },
  /**
   * Array of all dataset series labels and colors under cursor
   */
  series: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const tooltipEl = ref<HTMLElement | null>(null)

watch(tooltipEl, value => {
  if (value) {
    const { width, height } = value.getBoundingClientRect()

    emit('dimensions', { width, height })
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/base';
.tooltip-container {
  background-color: $color-white;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  max-width: 425px;
  min-width: 250px;
  pointer-events: none;
  position: absolute;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 999;
}

ul.tooltip {
  list-style: none;
  margin: 0px;
  min-width: 250px;
  padding-left: 0px;

  li {
    display: flex;
    font-size: $font-size-sm;
    margin: $spacing-8;
  }

  li:first-child {
    border-bottom: 1px solid $color-black-10;
  }

  .tooltip-title {
    display: flex;
    flex-direction: column;
    padding-bottom: $spacing-xxs;

    .title {
      font-size: $font-size-md;
      font-weight: bold;
    }
    .subtitle {
      font-size: $font-size-sm;
      margin-top: $spacing-8;
    }
  }

  .display-label {
    max-width: 75%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .display-value {
    margin-left: auto;
    padding-left: $spacing-8;
    white-space: nowrap;
  }

  .tooltip-legend {
    display: inline-flex;
    flex-direction: row;
    height: 15px;
    margin-right: 8px;
    width: 3px;
  }
}
</style>
