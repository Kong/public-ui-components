import { computed, reactive } from 'vue'

import { RedisType } from '../types'

import type { RedisConfigurationFormState } from '../types'

export const useRedisConfigurationForm = () => {
  const form = reactive<RedisConfigurationFormState>({
    fields: {
      name: '',
      type: RedisType.HOST_PORT_OPEN_SOURCE,
      port: 0,
      host: '',
      database: 0,
      username: '',
      password: '',
    },
    readonly: false,
    errorMessage: '',
  })

  const canSubmit = computed(() => {
    return !!form.fields.name.length && !!form.fields.host
  })

  return {
    form,
    canSubmit,
  }
}
