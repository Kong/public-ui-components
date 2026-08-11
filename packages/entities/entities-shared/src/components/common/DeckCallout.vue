<template>
  <KAlert
    class="deck-callout"
    dismissible
    @dismiss="$emit('dismiss')"
  >
    <i18nT keypath="deckCallout.body">
      <template #cta>
        <button
          class="cta"
          type="button"
          @click="$emit('click-cta')"
        >
          {{ t('deckCallout.cta') }}
        </button>
      </template>
    </i18nT>
  </KAlert>
</template>

<script setup lang="ts">
import composables from '../../composables'

const { i18n: { t }, i18nT } = composables.useI18n()

defineEmits<{
  'click-cta': []
  dismiss: []
}>()
</script>

<style lang="scss" scoped>
.deck-callout {
  margin-bottom: var(--kui-space-60, $kui-space-60);

  // A button was used for better accessibility
  .cta {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    padding: 0;
    text-decoration: underline;
  }
}
</style>
