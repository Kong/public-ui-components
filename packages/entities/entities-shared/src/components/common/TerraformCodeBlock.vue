<template>
  <div class="terraform-config config-card-code-block">
    <KCodeBlock
      v-if="props.entityRecord"
      id="terraform-codeblock"
      :code="terraformContent"
      language="terraform"
      theme="dark"
    />
  </div>
</template>

<script setup lang="ts">
import { type PropType, computed } from 'vue'
import { EventGatewayTypesArray, type SupportedEntityType, SupportedEntityTypesArray, IdentityTypesArray } from '../../types'

const SINGLE_INDENT = '  '

const props = defineProps({
  /** A record to indicate the entity's configuration, used to populate the Terraform code block */
  entityRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  entityType: {
    type: String as PropType<SupportedEntityType>,
    required: true,
    validator: (val: SupportedEntityType) => SupportedEntityTypesArray.includes(val),
  },
  credentialType: {
    type: String,
    default: '',
  },
  subEntityType: {
    // only for event gateway entities
    type: String,
    default: '',
  },
})

const isEventGatewayEntity = computed(() => {
  return EventGatewayTypesArray.includes(props.entityType)
})

const isIdentityEntity = computed(() => {
  return IdentityTypesArray.includes(props.entityType)
})

const buildBasicValString = (value: string | number | boolean, key: string): string => {
  const indent = SINGLE_INDENT
  let content = ''

  if (typeof value === 'string') {
    content += `${indent}${key} = "${value}"\n`
  } else { // boolean or number
    content += `${indent}${key} = ${String(value !== undefined && value !== null ? value : '')}\n`
  }

  return content
}

const buildObjectStr = (value: Record<string, any>, key?: string, additionalIndent = ''): string => {
  if (typeof value !== 'object') {
    return 'Invalid object'
  }


  const indent = SINGLE_INDENT + additionalIndent
  let content = ''

  if (key) {
    content += `${indent}${key} = {\n`
  }

  if (value === null) {
    if (key) {
      content += `${indent}}`
    } else {
      content = '{}'
    }

    return content
  }

  // for deeply nested objects, remove null values
  const strippedVal = Object.fromEntries(Object.entries(value).filter(([, val]) => val !== null))

  let valueContent = ''
  for (const [k, v] of Object.entries(strippedVal)) {
    if (Array.isArray(v)) {
      if (v.length === 0) {
        valueContent = '[]'
      } else {
        valueContent = '[\n'
        valueContent += buildArrayStr(v, undefined, indent)
        valueContent += `${indent}${SINGLE_INDENT}]`
      }
    } else if (v && typeof v === 'object') {
      valueContent = '{\n'
      valueContent += buildObjectStr(v, undefined, indent)
      valueContent += `${indent}${SINGLE_INDENT}}`
    } else { // string, number, boolean, or null/undefined -> string
      valueContent = String(v !== undefined && v !== null ? v : '')
    }

    if (typeof v === 'string') {
      // double quote strings
      valueContent = `"${valueContent}"`
    }

    content += `${indent}${SINGLE_INDENT}${k} = ${valueContent}\n`
  }

  return key ? content += `${indent}}\n` : content
}

const buildArrayStr = (arr: any[], key?: string, additionalIndent = ''): string => {
  if (!Array.isArray(arr)) {
    return 'Invalid array'
  }

  const indent = SINGLE_INDENT + additionalIndent
  let content = ''
  if (key) {
    if (arr.length === 0) {
      content += `${indent}${key} = [`
    } else {
      content += `${indent}${key} = [\n`
    }
  }

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]

    if (typeof item === 'object') {
      content += `${indent}${SINGLE_INDENT}{\n`
      content += buildObjectStr(item, undefined, indent)
      content += `${indent}${SINGLE_INDENT}}`
    } else if (typeof item === 'string') {
      content += `${indent}${SINGLE_INDENT}"${item}"`
    } else { // string, number, boolean, or null/undefined -> string
      content += `${indent}${SINGLE_INDENT}${String(item !== undefined && item !== null ? item : '')}`
    }

    // no comma on last entry
    if (i < arr.length - 1) {
      content += ','
    }

    content += '\n'
  }

  if (key) {
    if (arr.length === 0) {
      content += ']\n'
    } else {
      content += `${indent}]\n`
    }
  }

  return content
}

const generateConfig = (record: Record<string, any>): string => {
  let content = ''

  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      content += buildArrayStr(value, key)
    } else if (typeof value === 'object') {
      content += buildObjectStr(value, key)
    } else {
      content += buildBasicValString(value, key)
    }
  }

  return content
}

const terraformContent = computed((): string => {
  // filter out null/undefined values since terraform doesn't accept them
  // this logic isn't recursive, so manually handle nested config object
  const modifiedRecord = Object.fromEntries(Object.entries(props.entityRecord).filter(([, value]) => value !== null && value !== undefined))
  const modifiedConfig = props.entityRecord.config ? Object.fromEntries(Object.entries(props.entityRecord?.config).filter(([, value]) => value !== null && value !== undefined)) : undefined
  if (modifiedConfig) {
    modifiedRecord.config = modifiedConfig
  }

  // if empty object, display empty terraform, else convert to terraform and remove any trailing whitespace
  if (Object.keys(modifiedRecord).length === 0) {
    return ''
  }

  // clear id
  delete modifiedRecord.id

  let content = ''
  let parentEntityType = ''

  // store and clear parent data - handled separately below
  if (modifiedRecord.service?.id) {
    // routes and plugins can be a child of service
    parentEntityType = 'service'
    delete modifiedRecord.service
  } else if (modifiedRecord.route?.id) {
    // plugins can be a child of route
    parentEntityType = 'route'
    delete modifiedRecord.route
  } else if (modifiedRecord.consumer?.id) {
    // plugins can be a child of consumer
    parentEntityType = 'consumer'
    delete modifiedRecord.consumer
  } else if (modifiedRecord.consumer_group?.id) {
    // plugins and consumers can be a child of consumer_group
    parentEntityType = 'consumer_group'
    delete modifiedRecord.consumer_group
  } else if (modifiedRecord.certificate?.id) {
    // snis can be a child of certificate
    parentEntityType = 'certificate'
    delete modifiedRecord.certificate
  } else if (modifiedRecord.set?.id) {
    // keys can be a child of key_set
    parentEntityType = 'set'
    delete modifiedRecord.set
  }

  if (isEventGatewayEntity.value) {
    // special handling for event gateways
    const entityName = props.subEntityType
      ? `${props.entityType}_${props.subEntityType}`
      : props.entityType
    content += `resource "konnect_event_gateway_${entityName}" "my_eventgateway${entityName.replaceAll('_', '')}" {\n`
    content += `${SINGLE_INDENT}provider = konnect-beta \n` // remove this line if provider changes
  } else if (props.entityType === 'plugin') {
    // plugin type is specified separately
    //clone and convert '-' to '_' since terraform doesn't allow '-'
    const pluginType = props.credentialType.replace(/-/g, '_') || (modifiedRecord.name + '').replace(/-/g, '_')
    delete modifiedRecord.name

    content += `resource "konnect_gateway_plugin_${pluginType}" "my_${pluginType}" {\n`
  } else if (isIdentityEntity.value) {
    content += `resource "konnect_${props.entityType}" "my_${props.entityType}" {\n`
    content += `${SINGLE_INDENT}provider = konnect-beta\n`
  } else { // generic entity
    content += `resource "konnect_gateway_${props.entityType}" "my_${props.entityType}" {\n`
  }

  // main config
  content += generateConfig(modifiedRecord)

  // control plane id
  if (!isEventGatewayEntity.value) {
    content += `${SINGLE_INDENT}control_plane_id = konnect_gateway_control_plane.my_konnect_cp.id\n`
  } else if (parentEntityType) { // parent entity information if scoped
    content += `${SINGLE_INDENT}${parentEntityType} = {\n`
    content += `${SINGLE_INDENT}${SINGLE_INDENT}id = konnect_gateway_${parentEntityType}.my_${parentEntityType}.id\n`
    content += `${SINGLE_INDENT}}\n`
  }

  content += '}\n'

  return content
})
</script>
