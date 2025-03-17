<template>
  <KAlert
    v-if="routeFlavors.traditional && routeFlavors.expressions && (!recordFlavor || recordFlavor !== current)"
    :appearance="!recordFlavor ? 'info' : 'warning'"
    class="route-form-config-type-immutable-alert"
    data-testid="route-config-type-immutable-alert"
  >
    <template #default>
      <template v-if="!recordFlavor">
        {{ i18n.t('form.warning.cannotChangeFlavor.create') }}
      </template>
      <template v-else-if="recordFlavor !== current">
        {{ i18n.t('form.warning.cannotChangeFlavor.edit', { format: i18n.t(`form.flavors.${recordFlavor}`) }) }}
      </template>
    </template>
  </KAlert>
</template>

<script setup lang="ts">
import composables from '../../composables'
import type { RouteFlavor, RouteFlavors } from '../../types'

const { i18n } = composables.useI18n()

defineProps<{
  routeFlavors: RouteFlavors
  current?: RouteFlavor
  recordFlavor?: RouteFlavor
}>()
</script>

<style lang="scss" scoped>
.route-form-config-type-immutable-alert {
  margin-bottom: $kui_space_60;
}
</style>
