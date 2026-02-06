<!-- This is a wrapper component to reuse the passed-in slots inside and outside a KTab -->
<!-- PLEASE USE <RouteRuleComposer /> FOR EXTERNAL USAGES -->

<template>
  <KTabs
    v-if="tabs.length > 1"
    v-model="hash"
    data-testid="route-form-config-tabs"
    :tabs="tabs"
  >
    <template
      v-if="routeFlavors.traditional"
      #[`${RouteFlavor.TRADITIONAL}-anchor`]
    >
      {{ t('form.flavors.traditional') }}

      <KTooltip
        v-if="tooltips && tooltips[RouteFlavor.TRADITIONAL]"
        class="route-form-config-tabs-tooltip"
        :text="tooltips[RouteFlavor.TRADITIONAL]"
        tooltip-id="route-form-config-tabs-tooltip-traditional"
      >
        <InfoIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_30"
          tabindex="0"
        />
      </KTooltip>
    </template>

    <template
      v-if="routeFlavors.expressions"
      #[`${RouteFlavor.EXPRESSIONS}-anchor`]
    >
      {{ t('form.flavors.expressions') }}

      <KTooltip
        v-if="tooltips && tooltips[RouteFlavor.EXPRESSIONS]"
        class="route-form-config-tabs-tooltip"
        :text="tooltips[RouteFlavor.EXPRESSIONS]"
        tooltip-id="route-form-config-tabs-tooltip-expressions"
      >
        <InfoIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_30"
          tabindex="0"
        />
      </KTooltip>
    </template>

    <template
      v-if="routeFlavors.traditional"
      #[RouteFlavor.TRADITIONAL]
    >
      <slot name="before-content" />

      <slot :name="RouteFlavor.TRADITIONAL" />
    </template>

    <template
      v-if="routeFlavors.expressions"
      #[RouteFlavor.EXPRESSIONS]
    >
      <slot name="before-content" />

      <slot :name="RouteFlavor.EXPRESSIONS" />
    </template>
  </KTabs>

  <template v-else>
    <slot name="before-content" />

    <slot
      v-if="routeFlavors.traditional"
      :name="RouteFlavor.TRADITIONAL"
    />

    <slot
      v-else-if="routeFlavors.expressions"
      :name="RouteFlavor.EXPRESSIONS"
    />
  </template>
</template>

<script setup lang="ts">
/**
 * This is a wrapper component to reuse the passed-in slots inside and outside a KTab
 *
 * PLEASE USE <RouteFormRulesComposer /> FOR EXTERNAL USAGES
 */
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { InfoIcon } from '@kong/icons'
import { type Tab } from '@kong/kongponents'
import { computed } from 'vue'
import composables from '../../composables'
import { RouteFlavor, type RouteFlavors } from '../../types'

const { i18n: { t } } = composables.useI18n()

const hash = defineModel<string | undefined>({ required: true })

const props = defineProps<{
  routeFlavors: RouteFlavors
  tooltips?: {
    [RouteFlavor.TRADITIONAL]?: string
    [RouteFlavor.EXPRESSIONS]?: string
  }
}>()

const tabs = computed<Tab[]>(() => [
  ...props.routeFlavors.traditional
    ? [{
      hash: `#${RouteFlavor.TRADITIONAL}`,
      title: t('form.flavors.traditional'),
    }]
    : [],
  ...props.routeFlavors.expressions
    ? [{
      hash: `#${RouteFlavor.EXPRESSIONS}`,
      title: t('form.flavors.expressions'),
    }]
    : [],
])
</script>

<style lang="scss" scoped>
.route-form-config-tabs-tooltip {
  display: inline-flex;
  margin: var(--kui-space-auto, $kui-space-auto) var(--kui-space-0, $kui-space-0) var(--kui-space-auto, $kui-space-auto) var(--kui-space-20, $kui-space-20);
  vertical-align: middle;
}
</style>
