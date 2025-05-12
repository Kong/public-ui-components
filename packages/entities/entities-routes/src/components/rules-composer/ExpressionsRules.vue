<template>
  <KCard>
    <template #title>
      <div class="route-form-routing-rules-title-container">
        <span
          v-for="protocol in parsedProtocols"
          :key="protocol"
          class="protocol-title"
        >
          {{ protocol.toUpperCase() }}
        </span>
        <span class="routing-rules-title">
          {{ t('form.sections.routingExpression.title') }}
        </span>
      </div>
    </template>

    <RouteFormExpressionsEditorLoader
      v-model="fields.expression"
      :protocol="parsedProtocols[0]"
      :show-expressions-modal-entry="showExpressionsModalEntry"
      @notify="emit('notify', $event)"
    >
      <template #after-editor="editor">
        <slot
          :expression="editor.expression"
          name="after-expressions-editor"
          :state="editor.state"
        />
      </template>
    </RouteFormExpressionsEditorLoader>
  </KCard>

  <!-- Expressions Route Advanced Fields -->
  <KCollapse
    v-model="isAdvancedFieldsCollapsed"
    class="route-form-advanced-fields-collapse"
    trigger-alignment="leading"
    :trigger-label="t('form.show_more')"
  >
    <KCard>
      <div class="route-form-fields-container route-form-advanced-fields-container">
        <KSelect
          v-model="fields.https_redirect_status_code"
          data-testid="route-form-http-redirect-status-code"
          :items="HTTP_REDIRECT_STATUS_CODES"
          :label="t('form.fields.https_redirect_status_code.label')"
          :readonly="readonly"
          width="100%"
        />
        <KInput
          v-model="fields.priority"
          autocomplete="off"
          data-testid="route-form-priority"
          :label="t('form.fields.priority.label')"
          :label-attributes="{
            info: t('form.fields.priority.tooltip'),
            tooltipAttributes: { maxWidth: '400' },
          }"
          :readonly="readonly"
          type="number"
        />
        <KCheckbox
          v-if="isProtocolSelected(['http', 'https', 'ws', 'wss', 'tls', 'tcp', 'udp', 'tls_passthrough'])"
          v-model="fields.strip_path"
          data-testid="route-form-strip-path"
          :label="t('form.fields.strip_path.label')"
        />
        <KCheckbox
          v-model="fields.preserve_host"
          data-testid="route-form-preserve-host"
          :label="t('form.fields.preserve_host.label')"
        />
        <KCheckbox
          v-model="fields.request_buffering"
          data-testid="route-form-request-buffering"
          :label="t('form.fields.request_buffering.label')"
        />
        <KCheckbox
          v-model="fields.response_buffering"
          data-testid="route-form-response-buffering"
          :label="t('form.fields.response_buffering.label')"
        />
      </div>
    </KCard>
  </KCollapse>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../../composables'
import type { PROTOCOLS_TO_ROUTE_RULES } from '../../constants'
import { HTTP_REDIRECT_STATUS_CODES } from '../../constants'
import { type ExpressionsRouteRulesFields, type SharedRouteRulesFields } from '../../types'
import RouteFormExpressionsEditorLoader from '../RouteFormExpressionsEditorLoader.vue'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{
  protocols: keyof typeof PROTOCOLS_TO_ROUTE_RULES
  hideAdvanced?: boolean
  readonly?: boolean
  showExpressionsModalEntry?: boolean
}>()

const fields = defineModel<SharedRouteRulesFields & ExpressionsRouteRulesFields>('fields', { required: true })

const emit = defineEmits<{
  notify: [{ message: string, type: string }]
}>()

const isAdvancedFieldsCollapsed = ref<boolean>(true)

const parsedProtocols = computed((): string[] => props.protocols.split(',') || [])

const isProtocolSelected = (protocols: string[]): boolean => {
  return protocols.some(protocol => props.protocols.includes(protocol))
}
</script>

<style lang="scss" scoped>
@use "../../styles/mixins" as *;

@include routing-rules;
</style>
