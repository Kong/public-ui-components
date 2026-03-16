<template>
  <ObjectField
    as-child
    name="config"
    reset-label-path="reset"
  >
    <CalloutsForm />

    <ObjectField
      appearance="card"
      :fields-order="['headers', 'query', 'body', 'by_lua']"
      name="upstream"
    />

    <ObjectField
      appearance="card"
      name="cache"
    >
      <template #[`redis`]="redisProps">
        <ObjectField
          v-bind="redisProps"
          :fields-order="[
            'host', 'port', 'connection_is_proxied', 'database', 'username', 'password',
            'sentinel_master', 'sentinel_role', 'sentinel_nodes', 'sentinel_username', 'sentinel_password',
            'cluster_nodes', 'cluster_max_redirections', 'ssl', 'ssl_verify', 'server_name',
            'keepalive_backlog', 'keepalive_pool_size', 'read_timeout', 'send_timeout', 'connect_timeout',
          ]"
        />
      </template>
    </ObjectField>
  </ObjectField>
</template>

<script setup lang="ts">
import CalloutsForm from './CalloutsForm.vue'
import ObjectField from '../shared/ObjectField.vue'
</script>
