<template>
  <ObjectField name="request">
    <StringField
      label="Request › URL"
      name="url"
    />

    <EnumField
      :items="METHODS"
      label="Request › Method"
      name="method"
    />

    <ObjectField
      label="Request › Headers"
      name="headers"
      required
    >
      <BooleanField
        label="Request › Headers › Forward"
        name="forward"
      />

      <KeyValueField
        label="Request › Headers › Custom"
        name="custom"
      />
    </ObjectField>

    <ObjectField
      label="Request › Query"
      name="query"
    >
      <BooleanField
        label="Request › Query › Forward"
        name="forward"
      />

      <KeyValueField
        label="Request › Query › Custom"
        name="custom"
      />
    </ObjectField>

    <ObjectField
      label="Request › Body"
      name="body"
    >
      <BooleanField
        label="Request › Body › Decode"
        name="decode"
      />

      <BooleanField
        label="Request › Body › Forward"
        name="forward"
      />

      <KeyValueField
        label="Request › Body › Custom"
        name="custom"
      />
    </ObjectField>

    <ObjectField
      label="Request › HTTP Opts"
      name="http_opts"
    >
      <BooleanField
        label="Request › HTTP Opts › SSL Verify"
        name="ssl_verify"
      />

      <StringField
        label="Request › HTTP Opts › SSL Server Name"
        name="ssl_server_name"
      />

      <ObjectField
        label="Request › HTTP Opts › Timeouts"
        name="timeouts"
      >
        <NumberField
          label="Request › HTTP Opts › Timeouts › Connect"
          name="connect"
        />
        <NumberField
          label="Request › HTTP Opts › Timeouts › Write"
          name="write"
        />
        <NumberField
          label="Request › HTTP Opts › Timeouts › Read"
          name="read"
        />
      </ObjectField>

      <ObjectField
        label="Request › HTTP Opts › Proxy"
        name="proxy"
      >
        <StringField
          label="Request › HTTP Opts › Proxy › Auth Username"
          name="auth_username"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Auth Password"
          name="auth_password"
          show-password-mask-toggle
          type="password"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Http Proxy"
          name="http_proxy"
        />
        <StringField
          label="Request › HTTP Opts › Proxy › Https Proxy"
          name="https_proxy"
        />
      </ObjectField>
    </ObjectField>
    <ObjectField
      label="Request › Error"
      name="error"
    >
      <EnumField
        label="Request › Error › On Error"
        name="on_error"
      />

      <NumberField
        label="Request › Error › Retries"
        min="0"
        name="retries"
      />

      <ArrayField
        label="Request › Error › HTTP Statuses"
        name="http_statuses"
      >
        <template #item="{ fieldName }">
          <NumberField
            data-autofocus
            label=""
            :name="fieldName"
          />
        </template>
      </ArrayField>

      <NumberField
        label="Request › Error › Error Response Code"
        name="error_response_code"
      />

      <StringField
        label="Request › Error › Error Response Msg"
        name="error_response_msg"
      />
    </ObjectField>

    <StringField
      autosize
      class="rc-code"
      label="Request › By Lua"
      multiline
      name="by_lua"
      :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import ArrayField from '../shared/ArrayField.vue'
import KeyValueField from '../shared/KeyValueField.vue'
import ObjectField from '../shared/ObjectField.vue'
import StringField from '../shared/StringField.vue'
import BooleanField from '../shared/BooleanField.vue'
import EnumField from '../shared/EnumField.vue'
import NumberField from '../shared/NumberField.vue'
import { toSelectItems } from '../shared/utils'
import useI18n from '../../../composables/useI18n'

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

const { i18n: { t } } = useI18n()
</script>
