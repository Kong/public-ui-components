<template>
  <ObjectField
    hide-required-asterisk
    label="Cache › Redis"
    name="redis"
    required
  >
    <StringField
      label="Cache › Redis › Host"
      name="host"
    />
    <NumberField
      label="Cache › Redis › Port"
      name="port"
    />
    <BooleanField
      label="Cache › Redis › Connection Is Proxied"
      name="connection_is_proxied"
    />
    <NumberField
      label="Cache › Redis › Database"
      name="database"
    />
    <StringField
      label="Cache › Redis › Username"
      name="username"
    />
    <StringField
      label="Cache › Redis › Password"
      name="password"
    />
    <StringField
      label="Cache › Redis › Sentinel Master"
      name="sentinel_master"
    />
    <EnumField
      clearable
      label="Cache › Redis › Sentinel Role"
      name="sentinel_role"
    />
    <ArrayField
      appearance="card"
      label="Cache › Redis › Sentinel Nodes"
      name="sentinel_nodes"
    >
      <template #item="{ index }">
        <ObjectField
          child-only
          :name="String(index)"
        >
          <StringField name="host" />
          <NumberField name="port" />
        </ObjectField>
      </template>
    </ArrayField>
    <StringField
      label="Cache › Redis › Sentinel Username"
      name="sentinel_username"
    />
    <StringField
      label="Cache › Redis › Sentinel Password"
      name="sentinel_password"
    />
    <ArrayField
      appearance="card"
      label="Cache › Redis › Cluster Nodes"
      name="cluster_nodes"
    >
      <template #item="{ index }">
        <ObjectField
          child-only
          :name="String(index)"
        >
          <StringField
            label="IP"
            name="ip"
          />
          <NumberField name="port" />
        </ObjectField>
      </template>
    </ArrayField>
    <NumberField
      label="Cache › Redis › Cluster Max Redirections"
      max="100"
      min="0"
      name="cluster_max_redirections"
    />
    <BooleanField
      label="Cache › Redis › SSL"
      name="ssl"
    />
    <BooleanField
      label="Cache › Redis › SSL Verify"
      name="ssl_verify"
    />
    <StringField
      label="Cache › Redis › Server Name"
      name="server_name"
    />
    <NumberField
      label="Cache › Redis › Keepalive Backlog"
      name="keepalive_backlog"
    />
    <NumberField
      label="Cache › Redis › Keepalive Pool Size"
      name="keepalive_pool_size"
    />
    <NumberField
      label="Cache › Redis › Read Timeout"
      name="read_timeout"
    />
    <NumberField
      label="Cache › Redis › Send Timeout"
      name="send_timeout"
    />
    <NumberField
      label="Cache › Redis › Connect Timeout"
      name="connect_timeout"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import ArrayField from '../shared/ArrayField.vue'
import BooleanField from '../shared/BooleanField.vue'
import StringField from '../shared/StringField.vue'
import NumberField from '../shared/NumberField.vue'
import ObjectField from '../shared/ObjectField.vue'
import EnumField from '../shared/EnumField.vue'
</script>
