<template>
  <ObjectField
    label="Response"
    :label-attributes="getLabelAttributes('callouts.*.response')"
    required
  >
    <ObjectField
      label="Response › Headers"
      :label-attributes="getLabelAttributes('callouts.*.response.headers')"
      required
    >
      <BooleanField
        v-model="response.headers.store"
        label="Response › Headers › Store"
        :label-attributes="getLabelAttributes('callouts.*.response.headers.store')"
      />
    </ObjectField>
    <ObjectField
      label="Response › Body"
      :label-attributes="getLabelAttributes('callouts.*.response.body')"
      required
    >
      <BooleanField
        v-model="response.body.store"
        label="Response › Body › Store"
        :label-attributes="getLabelAttributes('callouts.*.response.body.store')"
      />
      <BooleanField
        v-model="response.body.decode"
        label="Response › Body › Decode"
        :label-attributes="getLabelAttributes('callouts.*.response.body.decode')"
      />
    </ObjectField>
    <StringField
      v-model.trim="response.by_lua"
      autosize
      class="rc-code"
      label="Response › By Lua"
      :label-attributes="getLabelAttributes('callouts.*.response.by_lua')"
      multiline
      :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BooleanField from '../shared/BooleanField.vue'
import ObjectField from '../shared/ObjectField.vue'
import StringField from '../shared/StringField.vue'
import { useFormShared } from '../shared/composables'
import type { RequestCallout } from './types'
import useI18n from '../../../composables/useI18n'

const { i18n: { t } } = useI18n()

const props = defineProps<{
  calloutIndex: number;
}>()

const { formData, getLabelAttributes } = useFormShared<RequestCallout>()

const response = computed(() => formData.callouts[props.calloutIndex].response)
</script>
