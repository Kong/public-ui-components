<template>
  <div class="dk-editor-main">
    <header class="header">
      <div class="actions">
        <KButton
          appearance="tertiary"
          target="_blank"
          to="https://developer.konghq.com/plugins/datakit/"
        >
          {{ t('plugins.free-form.datakit.visual_editor.view_docs') }}
          <ExternalLinkIcon />
        </KButton>
        <KButton>
          {{ t('plugins.free-form.datakit.visual_editor.save') }}
        </KButton>
      </div>
    </header>
    <div class="body">
      Flow content goes here
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { KButton } from '@kong/kongponents'
import { ExternalLinkIcon } from '@kong/icons'
import english from '../../../../../locales/en.json'

const { t } = createI18n<typeof english>('en-us', english)
</script>

<style lang="scss" scoped>
.dk-editor-main {
  display: flex;
  flex-direction: column;

  .header {
    align-items: center;
    border-bottom: 1px solid $kui-color-border;
    display: flex;
    flex: 0 0 auto;
    /* stylelint-disable-next-line custom-property-pattern */
    height: var(--dk-header-height);
    justify-content: flex-end;
    padding: 0px $kui-space-30 0px $kui-space-50;
  }

  .actions {
    display: flex;
    gap: $kui-space-30;
  }
}
</style>
