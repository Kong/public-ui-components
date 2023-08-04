<template>
  <div class="kong-ui-copy-uuid">
    <div
      v-if="format !== 'hidden'"
      data-testid="copy-id"
      :title="uuid"
    >
      <div
        :class="[
          'uuid-container',
          truncated ? 'truncated-uuid' : null,
          useMono ? 'mono' : null
        ]"
      >
        {{ uuidFormat }}
      </div>
    </div>
    <component
      :is="!!tooltip ? 'KTooltip' : 'div'"
      v-bind="wrapperProps"
      class="uuid-icon-wrapper"
    >
      <KClipboardProvider v-slot="{ copyToClipboard }">
        <span
          data-testid="copy-to-clipboard"
          role="button"
          tabindex="0"
          @click.stop="copyIdToClipboard(copyToClipboard)"
        >
          <KIcon
            class="uuid-icon"
            :color="iconColor"
            :hide-title="!!tooltip || undefined"
            icon="copy"
            size="16"
            :title="t('iconTitle')"
          />
        </span>
      </KClipboardProvider>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, PropType } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import { COPY_UUID_NOTIFY_KEY } from '../constants'
import type { CopyUuidNotifyParam } from '../types'

const { t } = createI18n('en-us', english)

const props = defineProps({
  uuid: {
    type: String,
    required: true,
  },
  truncated: {
    type: Boolean,
    default: true,
  },
  useMono: {
    type: Boolean,
    default: true,
  },
  notify: {
    type: Function as PropType<(param: CopyUuidNotifyParam) => void>,
    default: undefined,
  },
  iconColor: {
    type: String,
    default: 'rgba(0, 0, 0, 0.45)',
  },
  tooltip: {
    type: String,
    default: '',
  },
  successTooltip: {
    type: String,
    default: '',
  },
  format: {
    type: String as PropType<'uuid' | 'hidden' | 'redacted' | 'deleted'>,
    required: false,
    default: 'uuid',
    validator: (val: string) => ['uuid', 'hidden', 'redacted', 'deleted'].includes(val),
  },
})

const emit = defineEmits<{
  (e: 'success', val: string): void,
  (e: 'error', val: string): void,
}>()

const notifyTrimLength = 15
const notify = props.notify || inject(COPY_UUID_NOTIFY_KEY, () => { })
const hasSuccessTooltip = computed((): boolean => !!(props.tooltip && props.successTooltip))
const tooltipText = ref(props.tooltip)
const wrapperProps = computed(() => {
  return props.tooltip
    ? {
      label: tooltipText.value,
      positionFixed: true,
      maxWidth: '500px',
      placement: 'bottomStart',
    }
    : {}
})

const uuidFormat = computed(() => {
  if (props.format === 'redacted') {
    return '*****'
  } else if (props.format === 'deleted') {
    return `*${props.uuid.substring(0, 5)}`
  }
  return props.uuid
})

const updateTooltipText = (msg: string): void => {
  tooltipText.value = msg
  setTimeout(() => {
    tooltipText.value = props.tooltip
  }, 1800)
}

const copyIdToClipboard = (executeCopy: (prop: string) => boolean) => {
  if (!executeCopy(props.uuid)) {
    if (typeof notify === 'function') {
      notify({
        type: 'error',
        message: t('message.fail'),
      })
    }

    if (hasSuccessTooltip.value) {
      updateTooltipText(t('message.fail'))
    } else {
      emit('error', props.uuid)
    }

    return
  }

  const isTruncated = props.uuid.length > notifyTrimLength
  const messagePrefix = (props.format === 'hidden' || props.format === 'redacted') ? t('message.success.prefix') : `"${props.uuid.substring(0, notifyTrimLength) + (isTruncated ? '...' : '')}"`

  if (typeof notify === 'function') {
    notify({
      type: 'success',
      message: `${messagePrefix}${t('message.success.content')}`,
    })
  }

  if (hasSuccessTooltip.value) {
    updateTooltipText(props.successTooltip)
  } else {
    emit('success', props.uuid)
  }
}
</script>

<style lang="scss" scoped>
.kong-ui-copy-uuid {
  display: flex;

  .uuid-container {
    margin-right: $kui-space-50;
    white-space: nowrap;
  }

  .truncated-uuid {
    margin-right: 1ch;
    max-width: 10ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .uuid-icon-wrapper {
    align-items: center;
    cursor: pointer;
    display: flex;
  }

  .uuid-icon {
    display: flex;
  }
}
</style>
