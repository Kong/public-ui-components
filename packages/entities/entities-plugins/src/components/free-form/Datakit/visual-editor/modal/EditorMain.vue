<template>
  <div class="dk-editor-main">
    <header class="toolbar">
      <KButton>
        {{ t('plugins.free-form.datakit.visual_editor.save') }}
      </KButton>
    </header>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { KButton } from '@kong/kongponents'
import english from '../../../../../locales/en.json'

const { t } = createI18n<typeof english>('en-us', english)
</script>

<style lang="scss" scoped>
.dk-editor-main {
  display: flex;
  flex-direction: column;

  .toolbar {
    align-items: center;
    border-bottom: 1px solid $kui-color-border;
    display: flex;
    flex: 0 0 auto;
    /* stylelint-disable-next-line custom-property-pattern */
    height: var(--dk-header-height);
    justify-content: flex-end;
    padding: 0px $kui-space-30 0px $kui-space-50;
  }
}
</style>
