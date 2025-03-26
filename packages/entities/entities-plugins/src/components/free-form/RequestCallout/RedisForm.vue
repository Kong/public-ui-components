<template>
  <ObjectField
    label="Cache › Redis"
    :label-attributes="getLabelAttributes('cache.redis')"
    required
  >
    <StringField
      v-model="redis.host"
      label="Cache › Redis › Host"
      :label-attributes="getLabelAttributes('cache.redis.host')"
      :placeholder="getPlaceholder('cache.redis.host')"
    />
    <NumberField
      v-model="redis.port"
      label="Cache › Redis › Port"
      :label-attributes="getLabelAttributes('cache.redis.port')"
      max="65535"
      min="0"
      :placeholder="getPlaceholder('cache.redis.port')"
    />
    <BooleanField
      v-model="redis.connection_is_proxied"
      label="Cache › Redis › Connection Is Proxied"
      :label-attributes="getLabelAttributes('cache.redis.connection_is_proxied')"
    />
    <NumberField
      v-model="redis.database"
      label="Cache › Redis › Database"
      :label-attributes="getLabelAttributes('cache.redis.database')"
      :placeholder="getPlaceholder('cache.redis.database')"
    />
    <StringField
      v-model="redis.username"
      label="Cache › Redis › Username"
      :label-attributes="getLabelAttributes('cache.redis.username')"
      :placeholder="getPlaceholder('cache.redis.username')"
      show-vault-secret-picker
    />
    <StringField
      v-model="redis.password"
      label="Cache › Redis › Password"
      :label-attributes="getLabelAttributes('cache.redis.password')"
      :placeholder="getPlaceholder('cache.redis.password')"
      show-password-mask-toggle
      show-vault-secret-picker
      type="password"
    />
    <StringField
      v-model="redis.sentinel_master"
      label="Cache › Redis › Sentinel Master"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_master')"
      :placeholder="getPlaceholder('cache.redis.sentinel_master')"
    />
    <EnumField
      v-model="redis.sentinel_role"
      clearable
      :items="getSelectItems('cache.redis.sentinel_role')"
      label="Cache › Redis › Sentinel Role"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_role')"
      :placeholder="getPlaceholder('cache.redis.sentinel_role')"
    />
    <ArrayField
      appearance="card"
      :items="redis.sentinel_nodes"
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
          :placeholder="getPlaceholder('cache.redis.sentinel_nodes.*.host')"
          required
        />
        <NumberField
          v-model="item.port"
          label="Port"
          :label-attributes="getLabelAttributes('cache.redis.sentinel_nodes.*.port')"
          max="65535"
          min="0"
          :placeholder="getPlaceholder('cache.redis.sentinel_nodes.*.port')"
        />
      </template>
    </ArrayField>
    <StringField
      v-model="redis.sentinel_username"
      label="Cache › Redis › Sentinel Username"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_username')"
      :placeholder="getPlaceholder('cache.redis.sentinel_username')"
      show-vault-secret-picker
    />
    <StringField
      v-model="redis.sentinel_password"
      label="Cache › Redis › Sentinel Password"
      :label-attributes="getLabelAttributes('cache.redis.sentinel_password')"
      :placeholder="getPlaceholder('cache.redis.sentinel_password')"
      show-password-mask-toggle
      show-vault-secret-picker
      type="password"
    />
    <ArrayField
      appearance="card"
      :items="redis.cluster_nodes"
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
          :placeholder="getPlaceholder('cache.redis.cluster_nodes.*.ip')"
          required
        />
        <NumberField
          v-model="item.port"
          label="Port"
          :label-attributes="getLabelAttributes('cache.redis.cluster_nodes.*.port')"
          max="65535"
          min="0"
          :placeholder="getPlaceholder('cache.redis.cluster_nodes.*.port')"
        />
      </template>
    </ArrayField>
    <NumberField
      v-model="redis.cluster_max_redirections"
      label="Cache › Redis › Cluster Max Redirections"
      :label-attributes="getLabelAttributes('cache.redis.cluster_max_redirections')"
      max="100"
      min="0"
      :placeholder="getPlaceholder('cache.redis.cluster_max_redirections')"
    />
    <BooleanField
      label="Cache › Redis › SSL"
      :label-attributes="getLabelAttributes('cache.redis.ssl')"
      :model-value="redis.ssl || false"
      @update:model-value="redis.ssl = $event"
    />
    <BooleanField
      v-model="redis.ssl_verify"
      label="Cache › Redis › SSL Verify"
      :label-attributes="getLabelAttributes('cache.redis.ssl_verify')"
    />
    <StringField
      v-model="redis.server_name"
      label="Cache › Redis › Server Name"
      :label-attributes="getLabelAttributes('cache.redis.server_name')"
      :placeholder="getPlaceholder('cache.redis.server_name')"
    />
    <NumberField
      v-model="redis.keepalive_backlog"
      label="Cache › Redis › Keepalive Backlog"
      :label-attributes="getLabelAttributes('cache.redis.keepalive_backlog')"
      max="2147483646"
      min="0"
      :placeholder="getPlaceholder('cache.redis.keepalive_backlog')"
    />
    <NumberField
      v-model="redis.keepalive_pool_size"
      label="Cache › Redis › Keepalive Pool Size"
      :label-attributes="getLabelAttributes('cache.redis.keepalive_pool_size')"
      max="2147483646"
      min="1"
      :placeholder="getPlaceholder('cache.redis.keepalive_pool_size')"
    />
    <NumberField
      v-model="redis.read_timeout"
      label="Cache › Redis › Read Timeout"
      :label-attributes="getLabelAttributes('cache.redis.read_timeout')"
      max="2147473646"
      min="0"
      :placeholder="getPlaceholder('cache.redis.read_timeout')"
    />
    <NumberField
      v-model="redis.send_timeout"
      label="Cache › Redis › Send Timeout"
      :label-attributes="getLabelAttributes('cache.redis.send_timeout')"
      max="2147473646"
      min="0"
      :placeholder="getPlaceholder('cache.redis.send_timeout')"
    />
    <NumberField
      v-model="redis.connect_timeout"
      label="Cache › Redis › Connect Timeout"
      :label-attributes="getLabelAttributes('cache.redis.connect_timeout')"
      max="2147473646"
      min="0"
      :placeholder="getPlaceholder('cache.redis.connect_timeout')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ArrayField from '../shared/ArrayField.vue'
import BooleanField from '../shared/BooleanField.vue'
import StringField from '../shared/StringField.vue'
import NumberField from '../shared/NumberField.vue'
import ObjectField from '../shared/ObjectField.vue'
import EnumField from '../shared/EnumField.vue'
import { useFormShared } from '../shared/composables'
import type { RequestCallout } from './types'

const { formData, getLabelAttributes, getSelectItems, getDefault, getPlaceholder } = useFormShared<RequestCallout>()

const redis = computed(() => formData.cache.redis)

function addSentinelNode() {
  if (!formData.cache.redis.sentinel_nodes) {
    formData.cache.redis.sentinel_nodes = []
  }
  formData.cache.redis.sentinel_nodes.push(getDefault('cache.redis.sentinel_nodes.*'))
}

function removeSentinelNode(index: number) {
  formData.cache.redis.sentinel_nodes?.splice(index, 1)

  // array fields with `len_min > 0` can't be an empty array
  if (formData.cache.redis.sentinel_nodes?.length === 0) {
    formData.cache.redis.sentinel_nodes = null
  }
}

function addClusterNode() {
  if (!formData.cache.redis.cluster_nodes) {
    formData.cache.redis.cluster_nodes = []
  }
  formData.cache.redis.cluster_nodes.push(getDefault('cache.redis.cluster_nodes.*'))
}

function removeClusterNode(index: number) {
  formData.cache.redis.cluster_nodes?.splice(index, 1)

  // array fields with `len_min > 0` can't be an empty array
  if (formData.cache.redis.cluster_nodes?.length === 0) {
    formData.cache.redis.cluster_nodes = null
  }
}
</script>
