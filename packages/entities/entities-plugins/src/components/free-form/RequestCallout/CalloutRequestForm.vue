<template>
  <ObjectField
    label="Request"
    :label-attributes="getLabelAttributes('callouts.*.request')"
    required
  >
    <StringField
      label="Request › URL"
      :label-attributes="getLabelAttributes('callouts.*.request.url')"
      :model-value="request.url"
      :placeholder="getPlaceholder('callouts.*.request.url')"
      required
      @update:model-value="val => request.url = val ?? ''"
    />

    <EnumField
      v-model="request.method"
      :items="METHODS"
      label="Request › Method"
      :label-attributes="getLabelAttributes('callouts.*.request.method')"
      :placeholder="getPlaceholder('callouts.*.request.method')"
      required
    />

    <ObjectField
      label="Request › Headers"
      :label-attributes="getLabelAttributes('callouts.*.request.headers')"
      required
    >
      <BooleanField
        v-model="request.headers.forward"
        label="Request › Headers › Forward"
        :label-attributes="getLabelAttributes('callouts.*.request.headers.forward')"
      />

      <KeyValueField
        :initial-value="request.headers.custom"
        label="Request › Headers › Custom"
        :label-attributes="getLabelAttributes('callouts.*.request.headers.custom')"
        @change="val => request.headers.custom = val"
      />
    </ObjectField>

    <ObjectField
      label="Request › Query"
      :label-attributes="getLabelAttributes('callouts.*.request.query')"
      required
    >
      <BooleanField
        v-model="request.query.forward"
        label="Request › Query › Forward"
        :label-attributes="getLabelAttributes('callouts.*.request.query.forward')"
      />

      <KeyValueField
        :initial-value="request.query.custom"
        label="Request › Query › Custom"
        :label-attributes="getLabelAttributes('callouts.*.request.query.custom')"
        @change="val => request.query.custom = val"
      />
    </ObjectField>

    <ObjectField
      label="Request › Body"
      :label-attributes="getLabelAttributes('callouts.*.request.body')"
      required
    >
      <BooleanField
        v-model="request.body.forward"
        label="Request › Body › Forward"
        :label-attributes="getLabelAttributes('callouts.*.request.body.forward')"
      />

      <KeyValueField
        :initial-value="request.body.custom"
        label="Request › Body › Custom"
        :label-attributes="getLabelAttributes('callouts.*.request.body.custom')"
        @change="val => request.body.custom = val"
      />
    </ObjectField>

    <ObjectField
      label="Request › HTTP Opts"
      :label-attributes="getLabelAttributes('callouts.*.request.http_opts')"
      required
    >
      <BooleanField
        v-model="request.http_opts.ssl_verify"
        label="Request › HTTP Opts › SSL Verify"
        :label-attributes="getLabelAttributes('callouts.*.request.http_opts.ssl_verify')"
      />

      <StringField
        v-model="request.http_opts.ssl_server_name"
        label="Request › HTTP Opts › SSL Server Name"
        :label-attributes="getLabelAttributes('callouts.*.request.http_opts.ssl_server_name')"
        :placeholder="getPlaceholder('callouts.*.request.http_opts.ssl_server_name')"
      />

      <ObjectField
        label="Request › HTTP Opts › Timeouts"
        :label-attributes="getLabelAttributes('callouts.*.request.http_opts.timeouts')"
        @update:added="setTimeouts"
      >
        <NumberField
          label="Request › HTTP Opts › Timeouts › Connect"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.timeouts.connect')"
          max="2147473646"
          min="0"
          :model-value="request.http_opts.timeouts?.connect"
          :placeholder="getPlaceholder('callouts.*.request.http_opts.timeouts.connect')"
          @update:model-value="val => request.http_opts.timeouts!.connect = val"
        />
        <NumberField
          label="Request › HTTP Opts › Timeouts › Write"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.timeouts.write')"
          max="2147473646"
          min="0"
          :model-value="request.http_opts.timeouts?.write"
          :placeholder="getPlaceholder('callouts.*.request.http_opts.timeouts.write')"
          @update:model-value="val => request.http_opts.timeouts!.write = val"
        />
        <NumberField
          label="Request › HTTP Opts › Timeouts › Read"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.timeouts.read')"
          max="2147473646"
          min="0"
          :model-value="request.http_opts.timeouts?.read"
          :placeholder="getPlaceholder('callouts.*.request.http_opts.timeouts.read')"
          @update:model-value="val => request.http_opts.timeouts!.read = val"
        />
      </ObjectField>

      <ObjectField
        label="Request › HTTP Opts › Proxy"
        :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy')"
        @update:added="setProxy"
      >
        <StringField
          label="Request › HTTP Opts › Proxy › Auth Username"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy.auth_username')"
          :model-value="request.http_opts.proxy?.auth_username"
          :placeholder="getPlaceholder('callouts.*.request.http_opts.proxy.auth_username')"
          show-vault-secret-picker
          @update:model-value="val => request.http_opts.proxy!.auth_username = val"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Auth Password"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy.auth_password')"
          :model-value="request.http_opts.proxy?.auth_password"
          :placeholder="getPlaceholder('callouts.*.request.http_opts.proxy.auth_password')"
          show-vault-secret-picker
          @update:model-value="val => request.http_opts.proxy!.auth_password = val"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Http Proxy"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy.http_proxy')"
          :model-value="request.http_opts.proxy?.http_proxy"
          :placeholder="getPlaceholder('callouts.*.request.http_opts.proxy.http_proxy')"
          required
          @update:model-value="val => request.http_opts.proxy!.http_proxy = val"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Https Proxy"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy.https_proxy')"
          :model-value="request.http_opts.proxy?.https_proxy"
          :placeholder="getPlaceholder('callouts.*.request.http_opts.proxy.https_proxy')"
          required
          @update:model-value="val => request.http_opts.proxy!.https_proxy = val"
        />
      </ObjectField>
    </ObjectField>
    <ObjectField
      label="Request › Error"
      :label-attributes="getLabelAttributes('callouts.*.request.error')"
      required
    >
      <EnumField
        v-model="request.error.on_error"
        :items="getSelectItems('callouts.*.request.error.on_error')"
        label="Request › Error › On Error"
        :label-attributes="getLabelAttributes('callouts.*.request.error.on_error')"
        :placeholder="getPlaceholder('callouts.*.request.error.on_error')"
      />

      <NumberField
        v-model="request.error.retries"
        label="Request › Error › Retries"
        :label-attributes="getLabelAttributes('callouts.*.request.error.retries')"
        min="0"
        :placeholder="getPlaceholder('callouts.*.request.error.retries')"
      />

      <ArrayField
        :items="request.error.http_statuses"
        label="Request › Error › HTTP Statuses"
        :label-attributes="getLabelAttributes('callouts.*.request.error.http_statuses')"
        @add="addHttpStatus"
        @remove="removeHttpStatus"
      >
        <template #item="{ index }">
          <NumberField
            data-autofocus
            :model-value="request.error.http_statuses?.[index]"
            @update:model-value="val => request.error.http_statuses![index] = val"
          />
        </template>
      </ArrayField>

      <NumberField
        v-model="request.error.error_response_code"
        label="Request › Error › Error Response Code"
        :label-attributes="getLabelAttributes('callouts.*.request.error.error_response_code')"
        :placeholder="getPlaceholder('callouts.*.request.error.error_response_code')"
      />

      <StringField
        v-model="request.error.error_response_msg"
        label="Request › Error › Error Response Msg"
        :label-attributes="getLabelAttributes('callouts.*.request.error.error_response_msg')"
        :placeholder="getPlaceholder('callouts.*.request.error.error_response_msg')"
      />
    </ObjectField>

    <StringField
      v-model="request.by_lua"
      autosize
      class="rc-code"
      label="Request › By Lua"
      :label-attributes="getLabelAttributes('callouts.*.request.by_lua')"
      multiline
      :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ArrayField from '../shared/ArrayField.vue'
import KeyValueField from '../shared/KeyValueField.vue'
import ObjectField from '../shared/ObjectField.vue'
import { useFormShared } from '../shared/composables'
import StringField from '../shared/StringField.vue'
import BooleanField from '../shared/BooleanField.vue'
import EnumField from '../shared/EnumField.vue'
import NumberField from '../shared/NumberField.vue'
import type { RequestCallout } from './types'
import { toSelectItems } from '../shared/utils'
import useI18n from '../../../composables/useI18n'

const { i18n: { t } } = useI18n()

const METHODS = toSelectItems([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
  'CONNECT',
  'TRACE',
])


const props = defineProps<{
  calloutIndex: number;
}>()

const { formData, getLabelAttributes, getSelectItems, getDefault, getPlaceholder } = useFormShared<RequestCallout>()

const request = computed(() => formData.callouts[props.calloutIndex].request)

function setTimeouts(value: boolean) {
  const opts = request.value.http_opts

  if (value) {
    opts.timeouts = getDefault('callouts.*.request.http_opts.timeouts')
  } else {
    opts.timeouts = null
  }
}

function setProxy(value: boolean) {
  const opts = request.value.http_opts

  if (value) {
    opts.proxy = getDefault('callouts.*.request.http_opts.proxy')
  } else {
    opts.proxy = null
  }
}

function addHttpStatus() {
  if (request.value == null) {
    return
  }

  if (request.value.error.http_statuses == null) {
    request.value.error.http_statuses = []
  }

  request.value.error.http_statuses.push(null)
}

function removeHttpStatus(index: number) {
  const error = request.value.error
  if (error.http_statuses == null) {
    return
  }
  error.http_statuses.splice(index, 1)
  if (error.http_statuses.length === 0) {
    error.http_statuses = null
  }
}
</script>
