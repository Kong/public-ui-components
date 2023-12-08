<template>
  <KPrompt
    class="runtime-group-prompt"
    is-visible
    :prevent-proceed-on-enter="true"
    :title="`${i18n.t('label_modal.edit_modal_title')}: ${name}`"
    @canceled="$emit('set-toggle-modal')"
    @proceed="$emit('set-toggle-modal')"
  >
    <template #body-content>
      <div class="runtime-group-prompt-body">
        <p class="runtime-group-prompt-description">
          {{ i18n.t('label_modal.describe') }} <KExternalLink :href="labelsRulesDocumentationURL">
            {{ i18n.t('label_modal.view_documentation') }}
          </KExternalLink>
        </p>
      </div>

      <div
        v-for="item in tmpLabels"
        :key="item.id"
        class="runtime-group-prompt-inputs"
      >
        <div class="input-container">
          <KInput
            v-model.trim="item.key"
            :data-testid="`runtime-group-label-prompt-key-${item.id}`"
            :error="item.errors && !item.errors.key.isValid"
            :error-message="item.errors && item.errors.key.failureMessage"
            placeholder="Enter a key"
          />
        </div>
        <div class="divider">
          :
        </div>
        <div class="input-container">
          <KInput
            v-model.trim="item.value"
            :data-testid="`runtime-group-label-prompt-value-${item.id}`"
            :error="item.errors && !item.errors.value.isValid"
            :error-message="item.errors && item.errors.value.failureMessage"
            placeholder="Enter a value"
          />
        </div>
        <KButton
          appearance="tertiary"
          class="label-btn-remove"
          :class="{ visible: tmpLabels.length > MIN_COUNTER_LABELS }"
          :data-testid="`runtime-group-remove-button-label-${item.id}`"
          @click="removeLabel(item.id)"
        >
          <KIcon
            class="label-icon-remove"
            icon="close"
            :size="KUI_ICON_SIZE_30"
          />
        </KButton>
      </div>

      <div class="runtime-group-prompt-add-label">
        <KButton
          v-if="tmpLabels.length < MAX_COUNTER_LABELS"
          appearance="tertiary"
          data-testid="runtime-group-add-button-label"
          @click="addLabel"
        >
          <template #icon>
            <KIcon
              class="label-icon-plus"
              :color="KUI_COLOR_TEXT_PRIMARY"
              :disabled="tmpLabels.length === MAX_COUNTER_LABELS"
              icon="plus"
            />
          </template>
          {{ i18n.t('label_modal.add_label_button_text') }}
        </KButton>

        <KTooltip
          v-else
          :label="i18n.t('label_modal.add_label_tooltip_disabled')"
          position-fixed
        >
          <KButton
            appearance="tertiary"
            class="add-label-button-disabled"
            data-testid="runtime-group-add-button-label-disabled"
          >
            <template #icon>
              <KIcon
                class="label-icon-plus"
                icon="plus"
              />
            </template>
            {{ i18n.t('label_modal.add_label_button_text') }}
          </KButton>
        </KTooltip>
      </div>
    </template>

    <template #action-buttons>
      <div class="runtime-group-prompt-action-buttons-container">
        <div class="left-side">
          <KButton
            appearance="tertiary"
            data-testid="runtime-group-clear-all-button-label"
            @click="clearAllLabels"
          >
            {{ i18n.t('label_modal.clear_all_button_text') }}
          </KButton>
        </div>

        <div class="right-side">
          <KButton
            appearance="secondary"
            data-testid="runtime-group-cancel-button-label"
            @click="cancelLabels"
          >
            {{ i18n.t('label_modal.cancel_button_text') }}
          </KButton>

          <KButton
            appearance="primary"
            :class="[{ loading: 'loading-state' }]"
            data-testid="runtime-group-save-button-label"
            :disabled="loading"
            @click="emit('save')"
          >
            <template
              v-if="loading"
              #icon
            >
              <ProgressIcon
                size="16"
              />
            </template>
            {{ loading ? i18n.t('label_modal.loading_button_text') : i18n.t('label_modal.save_button_text') }}
          </KButton>
        </div>
      </div>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import composables from '../composables'
import { LabelScope } from '../enums'
import externalLinks from '../external-links'
import { KUI_COLOR_TEXT_PRIMARY, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { ProgressIcon } from '@kong/icons'

import type { PropType } from 'vue'
import type { Label } from 'src/types'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  labels: {
    type: Array as PropType<Label[]>,
    required: true,
    default: () => [],
  },
  id: {
    type: String,
    required: true,
  },
  scope: {
    type: String,
    default: 'RUNTIME_GROUP',
    validator: (val: LabelScope) => [LabelScope.RUNTIME_GROUP, LabelScope.SERVICE_HUB].includes(val),
  },
})

const emit = defineEmits(['save', 'set-toggle-modal', 'revalidate'])

const MAX_COUNTER_LABELS = 5
const MIN_COUNTER_LABELS = 1

const { i18n } = composables.useI18n()
const loading = ref<boolean>(false)
const tmpLabels = ref<Label[]>([])

const labelsRulesDocumentationURL = externalLinks.labelsRulesDocumentationURL

const addLabel = (): void => {
  if (tmpLabels.value.length <= MAX_COUNTER_LABELS) {
    tmpLabels.value.push({
      id: Date.now(),
      key: '',
      value: '',
    })
  }
}

const removeLabel = (labelId: number | string): void => {
  if (tmpLabels.value.length > MIN_COUNTER_LABELS) {
    tmpLabels.value = tmpLabels.value.filter(item => item.id !== labelId)
  }
}

const cancelLabels = (): void => {
  // Reset local labels array
  tmpLabels.value = []
  emit('set-toggle-modal')
}

onBeforeMount(() => {
  for (const label of props.labels) {
    tmpLabels.value.push({ ...label })
  }
})

const clearAllLabels = (): void => {
  tmpLabels.value = [{
    id: 1,
    key: '',
    value: '',
  }]
}
</script>

<style lang="scss">
.runtime-group-prompt {
  & .k-modal-dialog{
    max-width: 660px;
  }

  &.k-prompt .k-modal-dialog.modal-dialog .k-modal-content {
    & .k-prompt-header-content .style-heading-2 {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & .k-modal-body.modal-body .k-prompt-body {
      max-height: inherit;

      .k-prompt-body-content {
        width: 100%;
      }
    }

    & .k-modal-footer.modal-footer .k-prompt-action-buttons {
      margin-left: inherit;
      width: 100%;
    }

    & .loading-state .kong-icon.k-button-icon.kong-icon-spinner {
      padding: 0;
    }
  }

  .runtime-group-prompt-add-label .btn-link {
    border-radius: 0;
    padding: 0;

    &:focus {
      box-shadow: none;
    }

    & .label-icon-plus {
      height: inherit !important;
    }
  }

  .label-btn-remove.k-button.medium {
    margin-left: $kui-space-50;
    padding: $kui-space-0;
    visibility: hidden;

    &.visible {
      visibility: visible;
    }
  }

  .add-label-button-disabled.k-button.btn-link {
    color: $kui-color-text-neutral-weak;
    cursor: default;

    &:hover {
      text-decoration: none;
    }
  }

  .label-icon-remove {
    height: 16px;
  }

  &-error {
    margin-bottom: $kui-space-80;
  }

  &-description {
    font-size: $kui-font-size-30;

    & .external-link {
      display: contents;
    }
  }

  &-inputs {
    align-items: baseline;
    display: flex;
    height: 70px;

    .input-container {
      flex: 1 1 auto;
    }

    .divider {
      margin: $kui-space-0 $kui-space-50 !important;
    }
  }

  &-action-buttons-container {
    display: flex;
    justify-content: space-between;

    .right-side {
      display: flex;
      gap: $kui-space-40;
    }
  }

  .runtime-group-prompt-description {
    margin-top: $kui-space-0;
  }
}
</style>
