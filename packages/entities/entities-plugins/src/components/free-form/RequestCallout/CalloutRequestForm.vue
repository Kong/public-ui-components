<template>
  <ObjectField
    label="Request"
  >
    <StringField
      label="Request › URL"
      :label-attributes="getLabelAttributes('callouts.*.request.url')"
      :model-value="request?.url"
      required
      @update:model-value="request!.url = $event"
    />

    <SelectField
      clearable
      :items="METHODS"
      label="Request › Method"
      :label-attributes="getLabelAttributes('callouts.*.request.method')"
      :model-value="request?.method"
      required
      @update:model-value="request!.method = $event as typeof METHODS[number]['value']"
    />

    <ObjectField
      label="Request › Headers"
      :label-attributes="getLabelAttributes('callouts.*.request.headers')"
      @update:added="setHeaders"
    >
      <BooleanField
        label="Request › Headers › Forward"
        :label-attributes="getLabelAttributes('callouts.*.request.headers.forward')"
        :model-value="request?.headers?.forward || false"
        @update:model-value="request!.headers!.forward = $event"
      />

      <KeyValueField
        :initial-value="request?.headers?.custom"
        label="Request › Headers › Custom"
        :label-attributes="getLabelAttributes('callouts.*.request.headers.custom')"
        @change="request!.headers!.custom = $event"
      />
    </ObjectField>

    <ObjectField
      label="Request › Query"
      :label-attributes="getLabelAttributes('callouts.*.request.query')"
      @update:added="setQuery"
    >
      <BooleanField
        label="Request › Query › Forward"
        :label-attributes="getLabelAttributes('callouts.*.request.query.forward')"
        :model-value="request?.query?.forward || false"
        @update:model-value="request!.query!.forward = $event"
      />

      <KeyValueField
        :initial-value="request?.query?.custom"
        label="Request › Query › Custom"
        :label-attributes="getLabelAttributes('callouts.*.request.query.custom')"
        @change="request!.query!.custom = $event"
      />
    </ObjectField>

    <ObjectField
      label="Request › Body"
      :label-attributes="getLabelAttributes('callouts.*.request.body')"
      @update:added="setBody"
    >
      <BooleanField
        label="Request › Body › Forward"
        :label-attributes="getLabelAttributes('callouts.*.request.body.forward')"
        :model-value="request?.body?.forward || false"
        @update:model-value="request!.body!.forward = $event"
      />

      <KeyValueField
        :initial-value="request?.body?.custom"
        label="Request › Body › Custom"
        :label-attributes="getLabelAttributes('callouts.*.request.body.custom')"
        @change="request!.body!.custom = $event"
      />
    </ObjectField>

    <ObjectField
      label="Request › HTTP Opts"
      :label-attributes="getLabelAttributes('callouts.*.request.http_opts')"
      @update:added="setHttpOpts"
    >
      <BooleanField
        label="Request › HTTP Opts › SSL Verify"
        :label-attributes="getLabelAttributes('callouts.*.request.http_opts.ssl_verify')"
        :model-value="request?.http_opts?.ssl_verify || false"
        @update:model-value="request!.http_opts!.ssl_verify = $event"
      />

      <StringField
        label="Request › HTTP Opts › SSL Server Name"
        :label-attributes="getLabelAttributes('callouts.*.request.http_opts.ssl_server_name')"
        :model-value="request?.http_opts?.ssl_server_name"
        @update:model-value="request!.http_opts!.ssl_server_name = $event"
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
          :model-value="request?.http_opts?.timeouts?.connect"
          @update:model-value="request!.http_opts!.timeouts!.connect = $event"
        />
        <NumberField
          label="Request › HTTP Opts › Timeouts › Write"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.timeouts.write')"
          max="2147473646"
          min="0"
          :model-value="request?.http_opts?.timeouts?.write"
          @update:model-value="request!.http_opts!.timeouts!.write = $event"
        />
        <NumberField
          label="Request › HTTP Opts › Timeouts › Read"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.timeouts.read')"
          max="2147473646"
          min="0"
          :model-value="request?.http_opts?.timeouts?.read"
          @update:model-value="request!.http_opts!.timeouts!.read = $event"
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
          :model-value="request?.http_opts?.proxy?.auth_username"
          show-vault-secret-picker
          @update:model-value="request!.http_opts!.proxy!.auth_username = $event"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Auth Password"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy.auth_password')"
          :model-value="request?.http_opts?.proxy?.auth_password"
          show-vault-secret-picker
          @update:model-value="request!.http_opts!.proxy!.auth_password = $event"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Http Proxy"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy.http_proxy')"
          :model-value="request?.http_opts?.proxy?.http_proxy"
          required
          @update:model-value="request!.http_opts!.proxy!.http_proxy = $event"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Https Proxy"
          :label-attributes="getLabelAttributes('callouts.*.request.http_opts.proxy.https_proxy')"
          :model-value="request?.http_opts?.proxy?.https_proxy"
          required
          @update:model-value="request!.http_opts!.proxy!.https_proxy = $event"
        />
      </ObjectField>
    </ObjectField>
    <ObjectField
      label="Request › Error"
      :label-attributes="getLabelAttributes('callouts.*.request.error')"
      @update:added="setError"
    >
      <SelectField
        :items="ERROR_STRATEGIES"
        label="Request › Error › On Error"
        :label-attributes="getLabelAttributes('callouts.*.request.error.on_error')"
        :model-value="request?.error?.on_error"
        @update:model-value="request!.error!.on_error = $event as typeof ERROR_STRATEGIES[number]['value']"
      />

      <NumberField
        label="Request › Error › Retries"
        :label-attributes="getLabelAttributes('callouts.*.request.error.retries')"
        min="0"
        :model-value="request?.error?.retries"
        @update:model-value="request!.error!.retries = $event"
      />

      <ArrayField
        :items="request?.error?.http_statuses"
        label="Request › Error › HTTP Statuses"
        :label-attributes="getLabelAttributes('callouts.*.request.error.http_statuses')"
        @add="addHttpStatus"
        @remove="removeHttpStatus"
      >
        <template #item="{ index }">
          <NumberField
            data-autofocus
            :model-value="request?.error?.http_statuses?.[index]"
            @update:model-value="request!.error!.http_statuses![index] = $event"
          />
        </template>
      </ArrayField>

      <NumberField
        label="Request › Error › Error Response Code"
        :label-attributes="getLabelAttributes('callouts.*.request.error.error_response_code')"
        :model-value="request?.error?.error_response_code"
        @update:model-value="request!.error!.error_response_code = $event"
      />

      <StringField
        label="Request › Error › Error Response Msg"
        :label-attributes="getLabelAttributes('callouts.*.request.error.error_response_msg')"
        :model-value="request?.error?.error_response_msg"
        @update:model-value="request!.error!.error_response_msg = $event"
      />
    </ObjectField>

    <StringField
      autosize
      class="rc-code"
      label="Request › By Lua"
      :label-attributes="getLabelAttributes('callouts.*.request.by_lua')"
      :model-value="request?.by_lua"
      multiline
      placeholder="Enter Lua script here..."
      @update:model-value="request!.by_lua = $event"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ArrayField from '../shared/ArrayField.vue'
import KeyValueField from '../shared/KeyValueField.vue'
import ObjectField from '../shared/ObjectField.vue'
import { useFormShared } from './composables'
import { getDefaultCalloutRequestBody, getDefaultCalloutRequestError, getDefaultCalloutRequestHeaders, getDefaultCalloutRequestHttpOpts, getDefaultCalloutRequestHttpOptsProxy, getDefaultCalloutRequestHttpOptsTimeouts, getDefaultCalloutRequestQuery, toSelectItems } from './utils'
import StringField from '../shared/StringField.vue'
import BooleanField from '../shared/BooleanField.vue'
import SelectField from '../shared/EnumField.vue'
import NumberField from '../shared/NumberField.vue'

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

const ERROR_STRATEGIES = toSelectItems([
  'retry',
  'fail',
  'continue',
])

const props = defineProps<{
  calloutIndex: number;
}>()

const { formData, getLabelAttributes } = useFormShared()

const request = computed(() => formData.callouts?.[props.calloutIndex]?.request)

function setHeaders(value: boolean) {
  const request = formData.callouts?.[props.calloutIndex]?.request
  if (request == null) {
    return
  }

  if (value) {
    request.headers = getDefaultCalloutRequestHeaders()
  } else {
    delete request.headers
  }
}

function setQuery(value: boolean) {
  const request = formData.callouts?.[props.calloutIndex]?.request
  if (request == null) {
    return
  }

  if (value) {
    request.query = getDefaultCalloutRequestQuery()
  } else {
    delete request.query
  }
}

function setBody(value: boolean) {
  const request = formData.callouts?.[props.calloutIndex]?.request
  if (request == null) {
    return
  }

  if (value) {
    request.body = getDefaultCalloutRequestBody()
  } else {
    delete request.body
  }
}

function setHttpOpts(value: boolean) {
  const request = formData.callouts?.[props.calloutIndex]?.request
  if (request == null) {
    return
  }

  if (value) {
    request.http_opts = getDefaultCalloutRequestHttpOpts()
  } else {
    delete request.http_opts
  }
}

function setTimeouts(value: boolean) {
  const opts = formData.callouts?.[props.calloutIndex]?.request?.http_opts
  if (opts == null) {
    return
  }

  if (value) {
    opts.timeouts = getDefaultCalloutRequestHttpOptsTimeouts()
  } else {
    delete opts.timeouts
  }
}

function setProxy(value: boolean) {
  const opts = formData.callouts?.[props.calloutIndex]?.request?.http_opts
  if (opts == null) {
    return
  }

  if (value) {
    opts.proxy = getDefaultCalloutRequestHttpOptsProxy()
  } else {
    delete opts.proxy
  }
}

function setError(value: boolean) {
  const request = formData.callouts?.[props.calloutIndex]?.request
  if (request == null) {
    return
  }

  if (value) {
    request.error = getDefaultCalloutRequestError()
  } else {
    delete request.error
  }
}

function addHttpStatus() {
  const request = formData.callouts?.[props.calloutIndex]?.request
  if (request == null) {
    return
  }

  if (request.error?.http_statuses == null) {
    request.error!.http_statuses = []
  }

  request.error!.http_statuses.push(null)
}

function removeHttpStatus(index: number) {
  const error = formData.callouts?.[props.calloutIndex]?.request?.error
  if (error?.http_statuses == null) {
    return
  }
  error.http_statuses.splice(index, 1)
  if (error.http_statuses.length === 0) {
    delete error.http_statuses
  }
}
</script>
