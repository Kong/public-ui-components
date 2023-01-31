<template>
  <div class="kong-ui-copy-uuid">
    <div
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
        {{ isHidden ? '**********' : uuid }}
      </div>
    </div>
    <div class="uuid-icon-wrapper">
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
            icon="copy"
            size="16"
            :title="t('iconTitle')"
          />
        </span>
      </KClipboardProvider>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, PropType } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import { KClipboardProvider, KIcon } from '@kong/kongponents'
import { COPY_UUID_NOTIFY_KEY } from '../const'
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
  isHidden: {
    type: Boolean,
    default: false,
  },
  notify: {
    type: Function as PropType<(param: CopyUuidNotifyParam) => void>,
    default: undefined,
  },
  iconColor: {
    type: String,
    default: 'var(--black-45, rgba(0, 0, 0, 0.45))',
  },
})

const notifyTrimLength = 15
const notify = props.notify || inject(COPY_UUID_NOTIFY_KEY)

const copyIdToClipboard = (executeCopy: (prop: string) => boolean) => {
  if (!executeCopy(props.uuid)) {
    if (typeof notify === 'function') {
      notify({
        type: 'error',
        message: t('message.fail'),
      })
    }
    return
  }

  const isTruncated = props.uuid.length > notifyTrimLength
  const messagePrefix = props.isHidden
    ? t('message.success.prefix')
    : `"${props.uuid.substring(0, notifyTrimLength) + (isTruncated ? '...' : '')}"`
  if (typeof notify === 'function') {
    notify({
      type: 'success',
      message: `${messagePrefix}${t('message.success.content')}`,
    })
  }
}

</script>

<style lang="scss" scoped>
.kong-ui-copy-uuid {
  display: flex;

  .uuid-container {
    margin-right: 12px;
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
