<template>
  <ObjectField
    label="Cache › Redis"
    :label-attributes="getLabelAttributes('cache.redis')"
    required
  >
    <StringField
      v-model="formData.cache.redis.host"
      label="Cache › Redis › Host"
      :label-attributes="getLabelAttributes('cache.redis.host')"
    />
    <NumberField
      v-model="formData.cache.redis.port"
      label="Cache › Redis › Port"
      :label-attributes="getLabelAttributes('cache.redis.port')"
      max="65535"
      min="0"
    />
    <NumberField
      v-model="formData.cache.redis.connect_timeout"
      label="Cache › Redis › Connect Timeout"
      :label-attributes="getLabelAttributes('cache.redis.connect_timeout')"
      max="2147473646"
      min="0"
    />
    <NumberField
      v-model="formData.cache.redis.send_timeout"
      label="Cache › Redis › Send Timeout"
      :label-attributes="getLabelAttributes('cache.redis.send_timeout')"
      max="2147473646"
      min="0"
    />
    <NumberField
      v-model="formData.cache.redis.read_timeout"
      label="Cache › Redis › Read Timeout"
      :label-attributes="getLabelAttributes('cache.redis.read_timeout')"
      max="2147473646"
      min="0"
    />
    <StringField
      v-model="formData.cache.redis.username"
      label="Cache › Redis › Username"
      :label-attributes="getLabelAttributes('cache.redis.username')"
      show-vault-secret-picker
    />
    <StringField
      v-model="formData.cache.redis.password"
      label="Cache › Redis › Password"
      :label-attributes="getLabelAttributes('cache.redis.password')"
      show-vault-secret-picker
    />
    <StringField
      v-model="formData.cache.redis.sentinel_username"
      label="Cache › Redis › Sentinel Username"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_username')"
      show-vault-secret-picker
    />
    <StringField
      v-model="formData.cache.redis.sentinel_password"
      label="Cache › Redis › Sentinel Password"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_password')"
      show-vault-secret-picker
    />
    <NumberField
      v-model="formData.cache.redis.database"
      label="Cache › Redis › Database"
      :label-attributes="getLabelAttributes('cache.redis.database')"
    />
    <NumberField
      v-model="formData.cache.redis.keepalive_pool_size"
      label="Cache › Redis › Keepalive Pool Size"
      :label-attributes="getLabelAttributes('cache.redis.keepalive_pool_size')"
      max="2147483646"
      min="1"
    />
    <NumberField
      v-model="formData.cache.redis.keepalive_backlog"
      label="Cache › Redis › Keepalive Backlog"
      :label-attributes="getLabelAttributes('cache.redis.keepalive_backlog')"
      max="2147483646"
      min="0"
    />
    <StringField
      v-model="formData.cache.redis.sentinel_master"
      label="Cache › Redis › Sentinel Master"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_master')"
    />
    <SelectField
      v-model="formData.cache.redis.sentinel_role"
      clearable
      :items="SENTINEL_ROLES"
      label="Cache › Redis › Sentinel Role"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_role')"
    />
    <ArrayField
      appearance="card"
      :items="formData.cache.redis.sentinel_nodes"
      label="Cache › Redis › Sentinel Nodes"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_nodes')"
      @add="addSentinelNode"
      @remove="removeSentinelNode"
    >
      <template #item="{ item }">
        <StringField
          v-model="item.host"
          label="Host"
          :label-attributes="getLabelAttributes('cache.redis.sentinel_nodes.*.host')"
          required
        />
        <NumberField
          v-model="item.port"
          label="Port"
          :label-attributes="getLabelAttributes('cache.redis.sentinel_nodes.*.port')"
          max="65535"
          min="0"
        />
      </template>
    </ArrayField>
    <ArrayField
      appearance="card"
      :items="formData.cache.redis.cluster_nodes"
      label="Cache › Redis › Cluster Nodes"
      :label-attributes="getLabelAttributes('cache.redis.cluster_nodes')"
      @add="addClusterNode"
      @remove="removeClusterNode"
    >
      <template #item="{ item }">
        <StringField
          v-model="item.ip"
          label="IP"
          :label-attributes="getLabelAttributes('cache.redis.cluster_nodes.*.ip')"
          required
        />
        <NumberField
          v-model="item.port"
          label="Port"
          :label-attributes="getLabelAttributes('cache.redis.cluster_nodes.*.port')"
          max="65535"
          min="0"
        />
      </template>
    </ArrayField>

    <BooleanField
      label="Cache › Redis › SSL"
      :label-attributes="getLabelAttributes('cache.redis.ssl')"
      :model-value="formData.cache.redis.ssl || false"
      @update:model-value="formData.cache.redis.ssl = $event"
    />

    <BooleanField
      label="Cache › Redis › SSL Verify"
      :label-attributes="getLabelAttributes('cache.redis.ssl_verify')"
      :model-value="formData.cache.redis.ssl_verify || false"
      @update:model-value="formData.cache.redis.ssl_verify = $event"
    />

    <StringField
      v-model="formData.cache.redis.server_name"
      label="Cache › Redis › Server Name"
      :label-attributes="getLabelAttributes('cache.redis.server_name')"
    />
    <NumberField
      v-model="formData.cache.redis.cluster_max_redirections"
      label="Cache › Redis › Cluster Max Redirections"
      :label-attributes="getLabelAttributes('cache.redis.cluster_max_redirections')"
    />
    <BooleanField
      label="Cache › Redis › Connection Is Proxied"
      :label-attributes="getLabelAttributes('cache.redis.connection_is_proxied')"
      :model-value="formData.cache.redis.connection_is_proxied || false"
      @update:model-value="formData.cache.redis.connection_is_proxied = $event"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import ArrayField from '../shared/ArrayField.vue'
import BooleanField from '../shared/BooleanField.vue'
import StringField from '../shared/StringField.vue'
import NumberField from '../shared/NumberField.vue'
import ObjectField from '../shared/ObjectField.vue'
import SelectField from '../shared/EnumField.vue'
import { useFormShared } from './composables'
import { getDefaultRedisClusterNode, getDefaultRedisSentinelNode, toSelectItems } from './utils'

const SENTINEL_ROLES = toSelectItems(['master', 'slave', 'any'])

const { formData, getLabelAttributes } = useFormShared()

function addSentinelNode() {
  if (!formData.cache.redis.sentinel_nodes) {
    formData.cache.redis.sentinel_nodes = []
  }
  formData.cache.redis.sentinel_nodes.push(getDefaultRedisSentinelNode())
}

function removeSentinelNode(index: number) {
  formData.cache.redis.sentinel_nodes?.splice(index, 1)
}

function addClusterNode() {
  if (!formData.cache.redis.cluster_nodes) {
    formData.cache.redis.cluster_nodes = []
  }
  formData.cache.redis.cluster_nodes.push(getDefaultRedisClusterNode())
}

function removeClusterNode(index: number) {
  formData.cache.redis.cluster_nodes?.splice(index, 1)
}
</script>
