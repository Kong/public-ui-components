<template>
  <div class="metricscard">
    <div
      class="metricscard-title"
      :class="cardSize"
    >
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
    <div
      v-if="hasError"
      class="metricscard-error"
    >
      <KIcon
        icon="warning"
        size="20"
      />
      <div>{{ errorMessage }}</div>
    </div>
    <div
      v-else
      class="metricscard-value"
    >
      <div :style="`font-size:${metricFontSize}`">
        {{ metricValue }}
      </div>
      <div
        v-if="cardDisplayFull"
        class="metricscard-value-trend "
        :class="textColor(changePolarity)"
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
import { MetricCardSize } from '../../constants'

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

const colorAttribute = (polarity: number): string => {
  const trendColor = {
    red: "var(--kong-ui-metric-card-trend-negative, var(--red-500, '#d44324'))",
    green: "var(--kong-ui-metric-card-trend-positive, var(--green-500, '#07a88d'))",
    grey: "var(--kong-ui-metric-card-trend-neutral, var(--grey-500, '#6f7787'))",
  }

  return polarity > 0
    ? trendColor.green
    : polarity < 0
      ? trendColor.red
      : trendColor.grey
}

const textColor = (polarity: number): string => {
  return polarity > 0
    ? 'positive'
    : polarity < 0
      ? 'negative'
      : 'neutral'
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
  width: 100%;

  @media (max-width: ($kui-breakpoint-phablet - 1px)) {
    max-width: none;
    width: auto;
  }

  &:hover {
    border: none;
    text-decoration: none;
  }

  &-title {
    color: var(--kong-ui-metric-card-title, $kui-color-background-neutral);
    font-size: $kui-font-size-30;

    &.sm {
      font-size: $kui-font-size-20;
    }
  }

  &-value {
    color: var(--kong-ui-metric-card-value, $kui-color-text-neutral-stronger);
    display: flex;
    flex-direction: row;
    font-weight: 500;
    justify-content: space-between;
    margin: $kui-space-40 $kui-space-0 $kui-space-0 $kui-space-0;

    &-trend {
      align-items: center;
      display: flex;
      flex-direction: row;
      font-size: $kui-font-size-30;
      margin-bottom: $kui-space-0;
      margin-top: $kui-space-auto;

      .kong-icon {
        display: flex;
      }
      &.positive {
        color: var(--kong-ui-metric-card-trend-positive, $color-green);
      }
      &.negative {
        color: var(--kong-ui-metric-card-trend-negative, $color-red);
      }
      &.neutral {
        color: var(--kong-ui-metric-card-trend-neutral, $kui-color-background-neutral);
      }
    }
  }

  &-tooltip {
    display: inline-flex;
    margin: $kui-space-auto $kui-space-0 $kui-space-auto $kui-space-20;
    vertical-align: middle;
  }

  &-error {
    align-items: center;
    color: $kui-color-text-neutral-stronger;
    display: flex;
    flex-direction: row;
    font-size: $kui-font-size-20;
    margin-top: $kui-space-40;

    .kong-icon-warning {
      margin-right: $kui-space-50;
    }
  }

  // Only currently active tab should trigger tooltip hover
  &.active {
    .metricscard-tooltip {
      @include pointer-events-all;
    }
  }
}
</style>
