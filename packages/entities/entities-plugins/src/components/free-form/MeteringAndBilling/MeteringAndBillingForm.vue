<template>
  <StandardLayout
    v-bind="props"
    :plugin-config-description="t('plugins.free-form.metering-and-billing.sections.plugin_config.description')"
  >
    <template #field-renderers>
      <!-- BooleanField label + description overrides -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.meter_api_requests'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.metering-and-billing.fields.meter_api_requests.description')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.meter_ai_token_usage'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.metering-and-billing.fields.meter_ai_token_usage.description')"
        />
      </FieldRenderer>
      <!-- StringField description overrides -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.ssl_verify'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.metering-and-billing.fields.ssl_verify.description')"
          :label="t('plugins.free-form.metering-and-billing.fields.ssl_verify.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.subject.look_up_value_in'"
      >
        <EnumField
          v-bind="slotProps"
          :help="t('plugins.free-form.metering-and-billing.fields.look_up_value_in.help')"
          :label="t('plugins.free-form.metering-and-billing.fields.look_up_value_in.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.subject.field'"
      >
        <StringField
          v-bind="slotProps"
          :help="t('plugins.free-form.metering-and-billing.fields.subject_field.help')"
          :label="t('plugins.free-form.metering-and-billing.fields.subject_field.label')"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.subject_field.placeholder')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.timeout'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.timeout.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.keepalive'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.keepalive.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.queue.max_coalescing_delay'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.max_coalescing_delay.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.queue.initial_retry_delay'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.initial_retry_delay.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.queue.max_retry_delay'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.max_retry_delay.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.queue.max_retry_time'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.metering-and-billing.fields.queue.max_retry_time.label')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.attributes'"
      >
        <ArrayField
          v-bind="slotProps"
          collapsible
          :label="t('plugins.free-form.metering-and-billing.fields.attributes.title')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.attributes.*.look_up_value_in'"
      >
        <StringField
          v-bind="slotProps"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.attributes.look_up_value_in.placeholder')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.attributes.*.event_property_name'"
      >
        <StringField
          v-bind="slotProps"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.attributes.event_property_name.placeholder')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path.startsWith('config.attributes.') && path.endsWith('.look_up_value_in')"
      >
        <StringField
          v-bind="slotProps"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.attributes.look_up_value_in.placeholder')"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path.startsWith('config.attributes.') && path.endsWith('.event_property_name')"
      >
        <StringField
          v-bind="slotProps"
          :placeholder="t('plugins.free-form.metering-and-billing.fields.attributes.event_property_name.placeholder')"
        />
      </FieldRenderer>
    </template>

    <!-- Metering -->
    <div class="ff-mb-collapse">
      <header class="ff-mb-collapse-header">
        <div class="ff-mb-collapse-header-toggle">
          <button
            class="ff-mb-collapse-toggle-btn"
            type="button"
            @click.prevent.stop="meteringExpanded = !meteringExpanded"
          >
            <ChevronRightIcon
              class="ff-mb-collapse-toggle-btn-trigger-icon"
              :class="{ 'collapse-expanded': meteringExpanded }"
              decorative
              :size="KUI_ICON_SIZE_30"
            />
          </button>
          <KLabel class="ff-mb-collapse-label">
            {{ t('plugins.free-form.metering-and-billing.sections.metering.title') }}
          </KLabel>
        </div>
      </header>
      <SlideTransition>
        <div
          v-if="meteringExpanded"
          class="ff-mb-collapse-content"
        >
          <Field name="config.meter_api_requests" />
          <Field name="config.meter_ai_token_usage" />
        </div>
      </SlideTransition>
      <div
        v-if="meteringExpanded"
        class="ff-mb-indent-guide"
      />
    </div>

    <!-- Subject — ObjectField native collapse, 2-column content -->
    <div class="ff-mb-subject">
      <ObjectField
        :label="t('plugins.free-form.metering-and-billing.sections.subject.title')"
        name="config.subject"
        reset-label-path="reset"
      />
    </div>

    <!-- Attributes -->
    <Field name="config.attributes" />

    <!-- Ingestion -->
    <div class="ff-mb-collapse">
      <header class="ff-mb-collapse-header">
        <div class="ff-mb-collapse-header-toggle">
          <button
            class="ff-mb-collapse-toggle-btn"
            type="button"
            @click.prevent.stop="ingestionExpanded = !ingestionExpanded"
          >
            <ChevronRightIcon
              class="ff-mb-collapse-toggle-btn-trigger-icon"
              :class="{ 'collapse-expanded': ingestionExpanded }"
              decorative
              :size="KUI_ICON_SIZE_30"
            />
          </button>
          <KLabel class="ff-mb-collapse-label">
            {{ t('plugins.free-form.metering-and-billing.sections.ingestion.title') }}
          </KLabel>
        </div>
      </header>
      <SlideTransition>
        <div
          v-if="ingestionExpanded"
          class="ff-mb-collapse-content"
        >
          <StringField
            :help="t('plugins.free-form.metering-and-billing.fields.ingest_endpoint.help')"
            name="config.ingest_endpoint"
          />
          <Field name="config.api_token" />
          <Field name="config.ssl_verify" />
          <div class="ff-metering-billing-inline-row">
            <Field name="config.timeout" />
            <Field name="config.keepalive" />
          </div>
        </div>
      </SlideTransition>
      <div
        v-if="ingestionExpanded"
        class="ff-mb-indent-guide"
      />
    </div>

    <!-- Queue — in AdvancedFields, header-less, 2-column -->
    <AdvancedFields
      class="ff-advanced-fields-container"
      data-testid="ff-advanced-fields-container"
      hide-general-fields
    >
      <div class="ff-mb-queue">
        <KLabel class="ff-mb-queue-label">
          {{ t('plugins.free-form.metering-and-billing.sections.queue.title') }}
        </KLabel>
        <ObjectField
          as-child
          name="config.queue"
          reset-label-path="reset"
        />
      </div>
    </AdvancedFields>
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide, ref } from 'vue'
import { KLabel } from '@kong/kongponents'
import { ChevronRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import Field from '../shared/Field.vue'
import AdvancedFields from '../shared/AdvancedFields.vue'
import ObjectField from '../shared/ObjectField.vue'
import BooleanField from '../shared/BooleanField.vue'
import NumberField from '../shared/NumberField.vue'
import EnumField from '../shared/EnumField.vue'
import ArrayField from '../shared/ArrayField.vue'
import StringField from '../shared/StringField.vue'
import SlideTransition from '../shared/SlideTransition.vue'
import useI18n from '../../../composables/useI18n'

import type { Props } from '../shared/layout/StandardLayout.vue'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = useI18n()

const meteringExpanded = ref(true)
const ingestionExpanded = ref(true)


</script>

<style lang="scss" scoped>
// Mirrors ObjectField's collapse UI exactly
.ff-mb-collapse {
  position: relative;

  .ff-mb-indent-guide {
    bottom: 0;
    left: -10px;
    position: absolute;
    top: 20px;
    transform: translateX(-50%);
    width: 6px;

    &::before {
      border-left: 1px solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
      bottom: 0;
      content: '';
      left: 50%;
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      width: 0;
    }

    &:hover::before {
      border-left-color: var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
    }
  }

  &-header {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);

    &-toggle {
      align-items: center;
      display: flex;
    }
  }

  &-label.k-label {
    margin-bottom: 0;
    margin-top: 0;
  }

  &-toggle-btn {
    align-items: center;
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: none;
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
    cursor: pointer;
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    gap: var(--kui-space-20, $kui-space-20);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-left: -var(--kui-space-70, $kui-space-70);
    outline: none;
    padding: var(--kui-space-10, $kui-space-10);

    &:hover:not(:focus, :active, :disabled) {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    }

    &:focus-visible {
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    }

    &-trigger-icon {
      transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;

      &.collapse-expanded {
        transform: rotate(90deg);
      }
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-80, $kui-space-80);
    margin-top: var(--kui-space-20, $kui-space-20);
    padding: var(--kui-space-60, $kui-space-60) 0 var(--kui-space-20, $kui-space-20) var(--kui-space-60, $kui-space-60);
  }
}

.ff-mb-subject :deep(.ff-object-field-content) {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 calc(50% - var(--kui-space-60, $kui-space-60));
    min-width: 0;
  }
}

:deep([data-testid="ff-array-config.attributes"] .ff-object-field-as-child) {
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
    min-width: 0;
  }
}

:deep([data-testid="ff-array-config.attributes"] .ff-array-field-item-remove-tooltip) {
  align-self: flex-end;
  margin-bottom: var(--kui-space-20, $kui-space-20);
}

.ff-metering-billing-inline-row {
  display: flex;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
  }
}

.ff-mb-queue {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-label {
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  }

  :deep(.ff-object-field-as-child) {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--kui-space-60, $kui-space-60);

    > * {
      flex: 1 1 calc(50% - var(--kui-space-60, $kui-space-60));
      min-width: 0;
    }
  }
}

.ff-advanced-fields-container {
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  padding-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-heading) {
    margin: 0;
  }

  // Hide the advanced fields container if there are no advanced fields to show
  &:has(> .collapse-hidden-content > .ff-advanced-fields > .ff-object-field:empty:only-child) {
    display: none;
  }
}
</style>
