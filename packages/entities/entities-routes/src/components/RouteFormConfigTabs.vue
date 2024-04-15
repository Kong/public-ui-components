<template>
  <KTabs
    v-if="tabs.length > 1"
    v-model="tab"
    :tabs="tabs"
    @change="(t: string) => tab = t"
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
      v-if="routeFlavors.traditional"
      #[RouteFlavor.TRADITIONAL]
    >
      <slot name="before-content" />

      <slot :name="RouteFlavor.TRADITIONAL" />
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
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { InfoIcon } from '@kong/icons'
import { computed } from 'vue'
import useI18n from '../composables/useI18n'
import { RouteFlavor, type RouteFlavors } from '../types'

const { i18n: { t } } = useI18n()

const tab = defineModel<string>()

const props = defineProps<{
  routeFlavors: RouteFlavors,
  tooltips?: {
    [RouteFlavor.TRADITIONAL]?: string,
    [RouteFlavor.EXPRESSIONS]?: string,
  }
}>()

const tabs = computed(() => [
  ...props.routeFlavors.traditional
    ? [{
      hash: RouteFlavor.TRADITIONAL,
      title: t('form.flavors.traditional'),
    }]
    : [],
  ...props.routeFlavors.expressions
    ? [{
      hash: RouteFlavor.EXPRESSIONS,
      title: t('form.flavors.expressions'),
    }]
    : [],
])
</script>

<style lang="scss" scoped>
.route-form-config-tabs-tooltip {
  display: inline-flex;
  margin: $kui-space-auto $kui-space-0 $kui-space-auto $kui-space-20;
  vertical-align: middle;
}
</style>
