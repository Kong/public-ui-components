<template>
  <KCard class="sandbox-route-rules-composer-controls">
    <KCollapse
      v-model="isControlsCollapsed"
      :class="{ 'is-collapsed': isControlsCollapsed }"
      title="Controls"
    >
      <div class="wrapper">
        <KSelect
          v-model="protocols"
          data-testid="route-form-protocols"
          :items="protocolsItems"
          :label="t('form.fields.protocols.label')"
          width="300"
        />

        <div class="switches">
          <KInputSwitch
            v-model="routeFlavors.traditional"
            class="control-toggle"
            label="Traditional"
          />

          <KInputSwitch
            v-model="routeFlavors.expressions"
            class="control-toggle"
            label="Expressions"
          />

          <KInputSwitch
            v-model="showExpressionsModalEntry"
            class="control-toggle"
            label="Expressions modal entry"
          />
        </div>
      </div>
    </KCollapse>
  </KCard>

  <div class="side-by-side">
    <div class="bordered">
      <RouteFormRulesComposer
        v-model:fields="fields"
        :protocols="protocols"
        :route-flavors="routeFlavors"
        :show-expressions-modal-entry="showExpressionsModalEntry"
        @update:payload="payload = $event"
      />
    </div>

    <div class="preview">
      <KCodeBlock
        id="rules-preview"
        :code="JSON.stringify(payload, undefined, 2)"
        language="json"
        searchable
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TraditionalRouteRulesFields, TypedRouteRulesPayload } from '../../src'
import { type ExpressionsRouteRulesFields } from '../../src'
import RouteFormRulesComposer from '../../src/components/RouteFormRulesComposer.vue'
import composables from '../../src/composables'
import { INITIAL_ROUTE_RULES_FIELDS, type PROTOCOLS_TO_ROUTE_RULES } from '../../src/constants'

const { i18n: { t } } = composables.useI18n()

const protocolsItems = [
  { label: t('form.protocols.grpc'), value: 'grpc' },
  { label: t('form.protocols.grpcs'), value: 'grpcs' },
  { label: t('form.protocols.grpc,grpcs'), value: 'grpc,grpcs' },
  { label: t('form.protocols.http'), value: 'http' },
  { label: t('form.protocols.https'), value: 'https' },
  { label: t('form.protocols.http,https'), value: 'http,https' },
  { label: t('form.protocols.tcp'), value: 'tcp' },
  { label: t('form.protocols.tls'), value: 'tls' },
  { label: t('form.protocols.tls,udp'), value: 'tls,udp' },
  { label: t('form.protocols.tcp,udp'), value: 'tcp,udp' },
  { label: t('form.protocols.tcp,tls'), value: 'tcp,tls' },
  { label: t('form.protocols.tcp,tls,udp'), value: 'tcp,tls,udp' },
  { label: t('form.protocols.tls_passthrough'), value: 'tls_passthrough' },
  { label: t('form.protocols.udp'), value: 'udp' },
  { label: t('form.protocols.ws'), value: 'ws' },
  { label: t('form.protocols.wss'), value: 'wss' },
  { label: t('form.protocols.ws,wss'), value: 'ws,wss' },
]

const isControlsCollapsed = ref(false)
const showExpressionsModalEntry = ref(false)

const routeFlavors = ref({
  traditional: true,
  expressions: true,
})

const protocols = ref<keyof typeof PROTOCOLS_TO_ROUTE_RULES>('http')
const fields = ref<TraditionalRouteRulesFields & ExpressionsRouteRulesFields>({ ...INITIAL_ROUTE_RULES_FIELDS })

const payload = ref<TypedRouteRulesPayload>()
</script>

<style lang="scss" scoped>
.sandbox-route-rules-composer-controls {
  :deep(.k-collapse) {
    &.is-collapsed {
      .k-collapse-heading {
        margin-bottom: $kui-space-0 !important;
        align-items: center;
      }

      .k-collapse-title {
        margin-bottom: $kui-space-0 !important;
      }
    }
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;

    .switches {
      display: flex;
      flex-direction: row;
      gap: $kui-space-60;

      .control-toggle {
        margin-bottom: $kui-space-50;
      }
    }
  }
}

.side-by-side {
  margin-top: $kui-space-80;
  display: grid;
  grid-template-columns: 60% auto;
  gap: $kui-space-60;

  .bordered {
    border: 1px dashed $kui-color-border-neutral-weak;
    padding: $kui-space-60;
  }

  .preview {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
  }
}
</style>
