<template>
  <div class="metrics-card">
    <h5
      v-if="(title && cardDisplayFull)"
      class="color-grey-600"
    >
      {{ title }}
    </h5>
    <div class="type-sm color-grey-500">
      {{ subtitle }}
      <KTooltip
        v-if="tooltip"
        class="metrics-card-tooltip"
        :label="tooltip"
        placement="right"
      >
        <KIcon
          icon="info"
          size="12"
        />
      </KTooltip>
    </div>
    <KTooltip
      v-if="hasError"
      class="mt-2"
      :label="errorMessage"
    >
      <KIcon
        icon="warning"
        size="20"
      />
    </KTooltip>
    <div
      v-else
      class="metrics-card-value"
      :class="metricFontSize"
    >
      <div>
        {{ metricValue }}
      </div>
      <div
        v-if="cardDisplayFull"
        class="trend type-sm"
        :class="textColorClass(changePolarity)"
      >
        <KIcon
          v-if="changePolarity !== 0"
          :color="colorAttribute(changePolarity)"
          :icon="icon"
          size="18"
        />
        <div class="change">
          {{ metricChange }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { KIcon, KTooltip } from '@kong/kongponents'
import { MetricCardSize } from '../../types'

const props = defineProps({
  title: {
    type: String,
    required: false,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: '0%',
    required: true,
  },
  tooltip: {
    type: String,
    required: false,
    default: '',
  },
  timeframe: {
    type: String,
    required: false,
    default: '',
  },
  metricValue: {
    type: String,
    default: '',
  },
  metricChange: {
    type: String,
    required: true,
  },
  changePolarity: {
    type: Number,
    required: true,
  },
  icon: {
    type: String,
    default: '',
  },
  hasError: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: 'Vitals data error',
  },
  cardSize: {
    type: String as PropType<MetricCardSize>,
    required: false,
    default: () => 'lg',
  },
})

const trendColor = {
  red: '#d44324',
  green: '#07a88d',
  grey: '#6f7787',
}

const colorAttribute = (polarity: number): string => {
  return polarity > 0
    ? trendColor.green
    : polarity < 0
      ? trendColor.red
      : trendColor.grey
}

const textColorClass = (polarity: number): string => {
  return polarity > 0
    ? 'color-green-500'
    : polarity < 0
      ? 'color-red-500'
      : 'color-grey-600'
}

const cardDisplayFull = [MetricCardSize.Medium, MetricCardSize.Large, MetricCardSize.ExtraLarge].includes(props.cardSize)

const metricFontSize = [MetricCardSize.Medium, MetricCardSize.Large, MetricCardSize.ExtraLarge].includes(props.cardSize)
  ? 'type-xl'
  : 'type-md'

</script>

<style lang="scss">
@import "../../styles/base";

// If card is used inside a TabPanel, only the currently active tab
// should trigger tooltip hover
.traffic-card {
  &.active {
    .metrics-card-tooltip {
      @include pointer-events-all;
    }
  }
}
</style>

<style lang="scss" scoped>
@import "../../styles/base";

.metrics-card {
  display: flex;
  flex-direction: column;
  max-width: 320px;
  min-width: 20vw;

  @media (max-width: $viewport-sm) {
    max-width: none;
    width: auto;
  }

  &:hover {
    border: none;
    text-decoration: none;
  }

  &-title {
    color: var(--grey-500, '#6f7787');
    font-size: 12px;
  }

  &-tooltip {
    margin-left: 5px;
  }
  // Only currently active tab should trigger tooltip hover
  &.active {
    .metrics-card-tooltip {
      @include pointer-events-all;
    }
  }

  &-value {
    display: flex;
    flex-direction: row;
    font-weight: 500;
    justify-content: space-between;
    margin: 12px 0 0 0;

    .trend {
      display: flex;
      flex-direction: row;
      margin: 6px 0 0 48px;
    }
  }

  &-change {
    height: 24px;
    line-height: 24px;
  }

  .metrics-card-subvalue {
    color: var(--grey-500);
    font-size: var(--type-xs);
  }
}
</style>
