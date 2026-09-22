<template>
  <SandboxPage title="Version Compatibility">
    <template #controls>
      <div class="version-picker">
        <KLabel for="min-runtime-version">
          Runtime version
        </KLabel>
        <KSelect
          id="min-runtime-version"
          v-model="minRuntimeVersion"
          :items="versionItems"
          style="width: 220px;"
        />
      </div>
    </template>
    <Form
      class="form"
      :config="{ minRuntimeVersion }"
      :schema="schema"
      @change="console.log"
    >
      <template #[FIELD_RENDERERS]>
        <FieldRenderer
          v-slot="fieldProps"
          :match="({ path }) => path.endsWith('prompt_template_min_v21')"
        >
          <StringField
            v-bind="fieldProps"
            multiline
            :rows="4"
          />
        </FieldRenderer>
        <FieldRenderer
          v-slot="fieldProps"
          :match="({ path }) => path.endsWith('debug_mode_min_v21')"
        >
          <SwitchField v-bind="fieldProps" />
        </FieldRenderer>
      </template>
    </Form>
  </SandboxPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SandboxPage from '../SandboxPage.vue'
import { Form, FieldRenderer, StringField, SwitchField, FIELD_RENDERERS } from '../../src'
import type { FormSchema } from '../../src/form-schema'

const minRuntimeVersion = ref<string | undefined>('2.0')

const versionItems = [
  { value: '', label: 'Not provided (fail-open)' },
  { value: '2.0', label: '2.0' },
  { value: '2.1', label: '2.1' },
  { value: '2.2', label: '2.2' },
]

const schema: FormSchema = {
  type: 'record',
  fields: [
    {
      string_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            webhook_secret_min_v21: {
              type: 'string',
              description: 'A plain StringField (no one_of/enum) with the version compatibility '
                + 'check — hover the disabled input to see why.',
              encrypted: true,
              min_ai_gateway_version: '2.1',
            },
          },
          {
            prompt_template_min_v21: {
              type: 'string',
              description: 'The same check on a multiline StringField (rendered as a textarea '
                + 'via the field-renderers slot).',
              min_ai_gateway_version: '2.1',
            },
          },
        ],
      },
    },
    {
      enum_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            identifier_opts_min_v21: {
              type: 'string',
              description: 'Mirrors a real AI Gateway rate-limiting-advanced field: some '
                + 'identifier strategies were only added in AI Gateway 2.1 — individual options '
                + 'are disabled, not the whole field.',
              one_of: [
                'consumer',
                'consumer_group',
                'credential',
                'ip',
                'header',
                'path',
                'model',
                'provider',
                'service',
              ],
              enum_min_versions: [
                { min_ai_gateway_version: '2.1', value: 'credential' },
                { min_ai_gateway_version: '2.1', value: 'service' },
              ],
            },
          },
          {
            semantic_cache_strategy_min_v22: {
              type: 'string',
              description: 'A whole field that only exists as of AI Gateway 2.2 — the field '
                + 'itself is disabled (not hidden) below that version.',
              one_of: ['exact', 'semantic'],
              min_ai_gateway_version: '2.2',
            },
          },
        ],
      },
    },
    {
      number_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            retry_count_min_v21: {
              type: 'number',
              description: 'A NumberField with the version compatibility check.',
              min_ai_gateway_version: '2.1',
            },
          },
        ],
      },
    },
    {
      boolean_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            stream_enabled_min_v21: {
              type: 'boolean',
              description: 'A plain BooleanField (checkbox) with the version compatibility check.',
              min_ai_gateway_version: '2.1',
            },
          },
        ],
      },
    },
    {
      switch_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            debug_mode_min_v21: {
              type: 'boolean',
              description: 'A SwitchField (rendered via the field-renderers slot) with the '
                + 'version compatibility check.',
              min_ai_gateway_version: '2.1',
            },
          },
        ],
      },
    },
    {
      foreign_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            fallback_service_min_v21: {
              type: 'foreign',
              description: 'A ForeignField with the version compatibility check.',
              reference: 'services',
              min_ai_gateway_version: '2.1',
            },
          },
        ],
      },
    },
    {
      json_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            extra_metadata_min_v21: {
              type: 'json',
              json_schema: {},
              description: 'A JsonField with the version compatibility check.',
              min_ai_gateway_version: '2.1',
            },
          },
        ],
      },
    },
    {
      string_array_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            allowed_methods_min_v21: {
              type: 'set',
              description: 'A StringArrayField (tag input) with the version compatibility check.',
              elements: { type: 'string' },
              min_ai_gateway_version: '2.1',
            },
          },
        ],
      },
    },
    {
      array_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            legacy_routes_min_v22: {
              type: 'array',
              description: 'A whole array gated at the container level (not a field inside it) '
                + '— its own add/remove buttons are disabled, and every existing item inside '
                + 'inherits the lock too. Raise the runtime version to 2.2 to add an item, then '
                + 'lower it again to see the existing item freeze as well.',
              min_ai_gateway_version: '2.2',
              elements: { type: 'string' },
            },
          },
          {
            upstream_servers: {
              type: 'array',
              description: 'An array of records — the check also works on fields nested inside '
                + 'each item, both field-level (Host) and option-level (Protocol).',
              elements: {
                type: 'record',
                fields: [
                  {
                    host_min_v21: {
                      type: 'string',
                      description: 'Custom per-server load-balancing hosts were only added in '
                        + 'AI Gateway 2.1.',
                      min_ai_gateway_version: '2.1',
                    },
                  },
                  {
                    protocol_opts_min_v21: {
                      type: 'string',
                      description: 'Individual options are gated too, same as the top-level '
                        + 'Identifier field — grpc/grpcs were only added in AI Gateway 2.1.',
                      one_of: ['http', 'https', 'grpc', 'grpcs'],
                      enum_min_versions: [
                        { min_ai_gateway_version: '2.1', value: 'grpc' },
                        { min_ai_gateway_version: '2.1', value: 'grpcs' },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    {
      map_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            custom_headers_values_min_v21: {
              type: 'map',
              description: 'A simple map — the check is on the value schema, so every entry\'s '
                + 'value input is disabled the same way.',
              keys: { type: 'string' },
              values: {
                type: 'string',
                min_ai_gateway_version: '2.1',
              },
            },
          },
          {
            provider_configs: {
              type: 'map',
              description: 'A complex nested map — provider name → config record → a further '
                + 'nested per-model override map. The check still reaches the innermost value.',
              keys: { type: 'string' },
              values: {
                type: 'record',
                fields: [
                  {
                    model: {
                      type: 'string',
                    },
                  },
                  {
                    overrides_values_min_v21: {
                      type: 'map',
                      description: 'Per-model overrides were only added in AI Gateway 2.1.',
                      keys: { type: 'string' },
                      values: {
                        type: 'string',
                        min_ai_gateway_version: '2.1',
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    {
      object_fields: {
        type: 'record',
        required: true,
        fields: [
          {
            legacy_auth_min_v22: {
              type: 'record',
              description: 'A whole nested object gated at the container level — its own '
                + '"added" switch and collapse toggle are disabled, and it stays '
                + 'force-collapsed while locked, instead of just disabling the fields inside it.',
              min_ai_gateway_version: '2.2',
              fields: [
                {
                  api_key: {
                    type: 'string',
                    description: 'Has a schema default, which is skipped while this container '
                      + 'is locked — see the console log for the actual initial value.',
                    default: 'unreachable-default-key',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto;
  max-width: 100%;
  padding: 20px;
  width: 800px;
}
</style>
