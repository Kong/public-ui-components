<template>
  <RevealCollapse
    v-model="advancedCollapsed"
    data-testid="view-advanced"
    :trigger-label="advancedCollapsed ? t('plugins.form.grouping.advanced_parameters.view') : t('plugins.form.grouping.advanced_parameters.hide')"
  >
    <div class="ff-advanced-fields">
      <slot />
    </div>
  </RevealCollapse>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import RevealCollapse from './RevealCollapse.vue'
import english from '../../../locales/en.json'

const { t } = createI18n<typeof english>('en-us', english)

const advancedCollapsed = ref(true)
</script>

<style lang="scss" scoped>
.ff-advanced-fields {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-80, $kui-space-80);
}
</style>
