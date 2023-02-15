<template>
  <div class="metricscard">
    <div class="metricscard-title">
      <span>{{ title }}</span>
      <KTooltip
        v-if="tooltip"
        class="metricscard-tooltip"
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
      class="metricscard-value"
    >
      <div :style="`font-size:${metricFontSize}`">
        {{ metricValue }}
      </div>
      <div
        v-if="cardDisplayFull"
        class="metricscard-value-trend"
        :style="`color: ${textColor(changePolarity)}`"
      >
        <KIcon
          v-if="changePolarity !== 0"
          :color="colorAttribute(changePolarity)"
          :icon="icon"
          size="18"
        />
        <div>
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

const textColor = (polarity: number): string => {
  return polarity > 0
    ? trendColor.green
    : polarity < 0
      ? trendColor.red
      : trendColor.grey
}

const cardDisplayFull = [MetricCardSize.Medium, MetricCardSize.Large].includes(props.cardSize)

const metricFontSize = props.cardSize === MetricCardSize.ExtraLarge
  ? '48px'
  : [MetricCardSize.Medium, MetricCardSize.Large].includes(props.cardSize) ? '22px' : '16px'

</script>

<style lang="scss">
@import "../../styles/base";

.metricscard-tooltip {
  @include pointer-events-all;
}

// If card is used inside a TabPanel, only the active tab should trigger tooltip hover
.trafficcard {
  &.active {
    .metricscard-tooltip {
      @include pointer-events-all;
    }
  }
}
</style>

<style lang="scss" scoped>
@import "../../styles/base";

.metricscard {
  display: flex;
  flex-direction: column;
  max-width: 240px;
  width: 100%;

  @media (max-width: $viewport-md) {
    max-width: none;
    width: auto;
  }

  &:hover {
    border: none;
    text-decoration: none;
  }

  &-title {
    color: $metric-color-grey;
    font-size: $font-size-sm;
  }

  &-tooltip {
    display: inline-flex;
    vertical-align: middle;
    margin: auto 0 auto 5px;
  }

  // Only currently active tab should trigger tooltip hover
  &.active {
    .metricscard-tooltip {
      @include pointer-events-all;
    }
  }

  &-value {
    display: flex;
    flex-direction: row;
    font-weight: 500;
    justify-content: space-between;
    margin: 8px 0 0 0;

    &-trend {
      display: flex;
      flex-direction: row;
      font-size: $font-size-sm;
      margin-bottom: 0;
      margin-top: auto;
    }
  }
}
</style>
