<!-- eslint-disable vue/no-v-html -->

<template>
  <div
    v-if="schemaFocused && node"
    class="property-panel"
  >
    <div class="basic-line">
      <div class="key-path">
        {{ propertyKeys }}
      </div>
      <KBadge
        v-if="focusedType"
        appearance="info"
      >
        {{ focusedType }}
      </KBadge>
    </div>

    <div
      v-if="schemaFocused._fieldSchema?.default !== undefined"
      class="default-value"
    >
      <div class="default-value-label">
        Default value
      </div>
      <div class="default-value-value">
        {{ JSON.stringify(schemaFocused._fieldSchema?.default) }}
      </div>
    </div>

    <div class="documentation">
      <div class="documentation-label">
        Documentation
      </div>
      <div
        v-if="focusedSchemaDescription"
        class="documentation-body"
        v-html="focusedSchemaDescription"
      />
      <div v-else>
        No documentation available
      </div>
    </div>

    <div
      v-if="schemaFocused.type === 'object'"
      class="available-properties"
    >
      <div class="available-properties-label">
        Available properties
      </div>
      <div
        v-if="availableProperties.length > 0"
        class="available-properties-keys"
      >
        <div
          v-for="p in availableProperties"
          :key="p"
        >
          {{ p }}
        </div>
      </div>
      <div v-else>
        No available properties
      </div>
    </div>

    <div
      v-if="schemaFocused.enum"
      class="available-values"
    >
      <div class="available-values-label">
        Available values
      </div>
      <div
        v-if="availableValues.length > 0"
        class="available-values-values"
      >
        <div
          v-for="v in availableValues"
          :key="v"
          class="available-values-value"
        >
          {{ v }}
        </div>
      </div>
      <div v-else>
        No available properties
      </div>
    </div>
  </div>
  <div v-else>
    No property selected
  </div>
</template>

<script setup lang="ts">
import type { ASTNode } from '@kong/vscode-json-languageservice'
import { marked, type MarkedOptions } from 'marked'
import { computed, type PropType } from 'vue'
import { FieldSchemaType, type ExtendedJSONSchema } from '../../types'
import { obtainPropertyChain } from '../../utils'

const props = defineProps({
  node: {
    type: Object as PropType<ASTNode | undefined>,
    default: undefined,
  },
  schema: {
    type: Object as PropType<ExtendedJSONSchema>,
    default: undefined,
  },
})

const propertyChain = computed(() => obtainPropertyChain(props.node))

const propertyKeys = computed(() => {
  const keys = propertyChain.value.map((property) => property.keyNode.value)
  for (let i = keys.length - 1; i >= 0; i--) {
    if (keys[i].trim().length > 0) {
      break
    }
    keys.pop()
  }
  return keys.join('.')
})

const schemaFocused = computed(() => {
  if (!props.node) {
    return undefined
  }

  let schema = props.schema
  for (const property of propertyChain.value) {
    const propertyKey = property.keyNode.value
    if (!schema?.properties) {
      return undefined
    }
    const propertySchema = schema.properties[propertyKey]
    if (!propertySchema || typeof propertySchema !== 'object') {
      return undefined
    }
    schema = propertySchema
  }
  return schema
})

const availableProperties = computed(() => {
  const schema = schemaFocused.value
  if (!schema?.properties) {
    return []
  }
  return Object.keys(schema.properties)
})

const availableValues = computed(() => {
  const schema = schemaFocused.value
  if (!schema?.enum) {
    return []
  }
  return schema.enum
})

const focusedType = computed(() => {
  const fieldType = schemaFocused.value?._fieldSchema?.type
  if (!fieldType) {
    return undefined
  }
  switch (fieldType) {
    case FieldSchemaType.String:
      return 'String'
    case FieldSchemaType.Number:
      return 'Number'
    case FieldSchemaType.Integer:
      return 'Integer'
    case FieldSchemaType.Boolean:
      return 'Boolean'
    case FieldSchemaType.Foreign:
      return 'Foreign'
    case FieldSchemaType.Array:
      return 'Array'
    case FieldSchemaType.Set:
      return 'Set'
    case FieldSchemaType.Map:
      return 'Map'
    case FieldSchemaType.Record:
      return 'Record'
    case FieldSchemaType.Function:
      return 'Function'
    case FieldSchemaType.JSON:
      return 'JSON'
    default:
      return undefined
  }
})

const focusedSchemaDescription = computed(() => {
  const description = schemaFocused.value?._fieldSchema?.description
  if (!description) {
    return undefined
  }
  return marked.parse(description, { mangle: false, headerIds: false } as MarkedOptions)
})
</script>

<style lang="scss" scoped>
.property-panel {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;

  .default-value {
    display: flex;
    flex-direction: column;
    gap: $kui-space-30;

    .default-value-label {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-bold;
    }

    .default-value-value {
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-20;
      background-color: $kui-color-background-neutral-weakest;
      padding: $kui-space-20;
      border-radius: $kui-border-radius-20;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  .documentation {
    display: flex;
    flex-direction: column;
    gap: $kui-space-30;

    .documentation-label {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-bold;
    }

    .documentation-body {
      font-size: $kui-font-size-30;

      &> :deep(:first-child) {
        margin-top: 0;
      }

      &> :deep(:last-child) {
        margin-bottom: 0;
      }
    }
  }

  .available-properties {
    display: flex;
    flex-direction: column;
    gap: $kui-space-30;

    .available-properties-label {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-bold;
    }

    .available-properties-keys {
      display: flex;
      flex-direction: column;
      gap: $kui-space-20;
      font-family: $kui-font-family-code;
    }
  }

  .available-values {
    .available-values-label {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-bold;
    }

    .available-values-values {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: $kui-space-20;
      font-family: $kui-font-family-code;

      .available-values-value {
        font-size: $kui-font-size-20;
        background-color: $kui-color-background-neutral-weakest;
        padding: $kui-space-20;
        border-radius: $kui-border-radius-20;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }
  }
}

.basic-line {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $kui-space-40;

  .key-path {
    font-family: $kui-font-family-code;
    font-size: $kui-font-size-30;
  }
}
</style>
