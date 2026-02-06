<template>
  <div :class="['request-card', { active: props.active }]">
    <CloseIcon
      class="close-btn"
      :size="KUI_ICON_SIZE_30"
      @click="emit('remove')"
    />
    <div class="badges">
      <KBadge
        appearance="info"
        class="protocol"
      >
        {{ protocol }}
      </KBadge>
      <KBadge
        v-if="['http', 'https'].includes(protocol) && method"
        :appearance="getMethodBadgeAppearance(method)"
      >
        {{ method.toUpperCase() }}
      </KBadge>
    </div>
    <div class="url">
      {{ url }}
    </div>
    <div
      v-if="sni"
      class="sni"
    >
      <div class="section-title">
        {{ i18n.t('request.SNI') }}
      </div>
      <div class="sni-content">
        {{ sni }}
      </div>
    </div>
    <div
      v-if="headers && Object.keys(headers).length > 0"
      class="headers"
    >
      <div class="section-title">
        {{ i18n.t('request.headers') }}
      </div>
      <ul
        v-for="(values, key) in headers"
        :key="key"
        class="header"
      >
        <li class="header-key">
          {{ key }}
          <ul>
            <template v-if="Array.isArray(values)">
              <li
                v-for="value in values"
                :key="value"
                class="header-value"
              >
                {{ value }}
              </li>
            </template>
            <li
              v-else
              :key="values"
              class="header-value"
            >
              {{ values }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { computed } from 'vue'
import { CloseIcon } from '@kong/icons'
import { BadgeMethodAppearances, type BadgeAppearance } from '@kong/kongponents'
import composables from '../composables'

const props = defineProps<{
  active?: boolean
  protocol: string
  host: string
  port?: number
  path?: string
  method?: string
  headers?: { [k: string]: string | string[] }
  sni?: string
}>()

const emit = defineEmits<{
  remove: []
}>()

const { i18n } = composables.useI18n()

const url = computed(() => {
  const port = typeof props.port === 'number' && ((props.protocol === 'http' && props.port !== 80) || (props.protocol === 'https' && props.port !== 443)) ? props.port : undefined
  const hostPort = [props.host, ...port ? [port] : []].join(':')
  const origin = `${props.protocol}://${hostPort}`
  const path = props.path ?? '/'

  return `${origin}${path}`
})

const getMethodBadgeAppearance = (method: string): BadgeAppearance => {
  const lowerCasedMethod = method.toLowerCase()

  return (Object.values(BadgeMethodAppearances).includes(lowerCasedMethod as any)
    ? lowerCasedMethod
    : 'custom') as BadgeAppearance
}
</script>

<style lang="scss" scoped>
.request-card {
  align-items: flex-start;
  background-color: var(--kui-color-background, $kui-color-background);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
  justify-content: flex-start;
  min-width: 0;
  padding: var(--kui-space-50, $kui-space-50);
  position: relative;

  &::before {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    content: ' ';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  &.active::before {
    border: var(--kui-border-width-20, $kui-border-width-20) solid var(--kui-color-border-primary-weak, $kui-color-border-primary-weak);
  }

  .close-btn {
    cursor: pointer;
    display: none !important;
    position: absolute;
    right: 12px;
    top: 12px;
  }

  &:hover {
    .close-btn {
      display: block !important;
    }
  }

  .badges {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-40, $kui-space-40);
    margin-bottom: var(--kui-space-30, $kui-space-30);
  }

  .url {
    color: var(--kui-color-text, $kui-color-text);
    font-family: var(--kui-font-family-code, $kui-font-family-code);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    word-break: break-all;
  }

  .headers {
    .header {
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      list-style: none;

      &,
      ul {
        margin: 0;
        padding: 0;
      }

      li {
        list-style: none;
        margin-left: var(--kui-space-60, $kui-space-60);
        padding-left: var(--kui-space-30, $kui-space-30);
        position: relative;
        word-break: break-all;
      }

      li::before {
        background-color: #000;
        bottom: -12px;
        content: " ";
        left: -10px;
        position: absolute;
        top: 5px;
        width: 1px;
      }

      li:not(:first-child):last-child::before {
        display: none;
      }

      li:only-child::before {
        background-color: #000;
        bottom: 7px;
        content: " ";
        display: list-item;
        height: 7px;
        left: -10px;
        position: absolute;
        top: 5px;
        width: 1px;
      }

      li::after {
        background-color: #000;
        content: " ";
        height: 1px;
        left: -10px;
        position: absolute;
        top: 12px;
        width: 10px;
      }
    }

    .header-key {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: bold;
      margin-left: var(--kui-space-40, $kui-space-40);
      word-break: break-all;
    }

    .header-value {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: normal;
      margin-left: var(--kui-space-60, $kui-space-60);
      word-break: break-all;
    }
  }

  .sni {
    .sni-content {
      font-family: var(--kui-font-family-code, $kui-font-family-code);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      word-break: break-all;
    }
  }

  .section-title {
    font-weight: bold;
  }
}
</style>
