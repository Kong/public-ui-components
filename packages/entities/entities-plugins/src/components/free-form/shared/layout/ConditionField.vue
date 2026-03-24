<template>
  <div>
    <KLabel
      :for="conditionFieldId"
      :label="t('plugins.form.fields.condition.label')"
    >
      <div class="label-content">
        {{ t('plugins.form.fields.condition.label') }}

        <KTooltip class="label-tooltip">
          <InfoIcon
            class="tooltip-trigger-icon"
            tabindex="0"
          />
          <template #content>
            {{ t('plugins.form.fields.condition.tooltip') }}
          </template>
        </KTooltip>

        <KBadge
          appearance="decorative"
          size="small"
        >
          Beta
        </KBadge>
      </div>
    </KLabel>

    <StringField
      :input-id="conditionFieldId"
      :label="''"
      name="condition"
      :placeholder="t('plugins.form.fields.condition.placeholder')"
    >
      <template #help>
        <i18nT keypath="plugins.form.fields.condition.help.about">
          <template #link>
            <KExternalLink
              hide-icon
              :href="externalLinks.condition"
            >
              {{ t('plugins.form.fields.condition.help.learn') }}
            </KExternalLink>
          </template>
        </i18nT>
      </template>
    </StringField>
  </div>
</template>

<script setup lang="ts">
import { KTooltip } from '@kong/kongponents'
import { InfoIcon } from '@kong/icons'
import { useId } from 'vue'
import StringField from '../StringField.vue'
import externalLinks from '../../../../external-links'
import useI18n from '../../../../composables/useI18n'

const conditionFieldId = useId()
const { i18n: { t }, i18nT } = useI18n()
</script>

<style lang="scss" scoped>
.label-content {
  align-items: center;
  display: inline-flex;
  gap: var(--kui-space-40, $kui-space-40);

  .label-tooltip {
    .tooltip-trigger-icon {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral) !important;
      cursor: help;
      height: var(--kui-icon-size-30, $kui-icon-size-30) !important;
      width: var(--kui-icon-size-30, $kui-icon-size-30) !important;
    }
  }

  :deep(.k-tooltip) {
    width: 300px;
  }
}
</style>
