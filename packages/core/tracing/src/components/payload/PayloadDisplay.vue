<template>
  <div class="payload-display">
    <KSkeleton
      v-if="showSkeleton"
      :table-columns="2"
      :table-rows="8"
      type="table"
    />

    <template v-else>
      <div
        class="title-wrapper"
        @click="expanded = !expanded"
      >
        <div
          class="title"
        >
          {{ title }}
        </div>

        <ChevronDownIcon
          v-if="expanded"
          class="toggle"
        />
        <ChevronRightIcon
          v-else
          class="toggle"
        />
      </div>

      <template v-if="expanded">
        <div
          v-if="payload.type === 'headers'"
          class="payload-headers"
        >
          <template
            v-for="(value, key) in payload.headers"
            :key="key"
          >
            <ConfigCardItem
              :item="{
                type: ConfigurationSchemaType.Text,
                key: key,
                label: key,
                value: value
              }"
            />
          </template>
        </div>
        <div
          v-else
          class="payload-body"
        >
          <KCodeBlock
            id="`payload-${title}`"
            :code="payloadContent.formatted"
            :language="payloadContent.language"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ConfigCardItem, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import { ChevronDownIcon, ChevronRightIcon } from '@kong/icons'
import { computed, ref } from 'vue'
import { WATERFALL_ROW_COLUMN_GAP } from '../../constants'
import type { Payload } from '../../types'

const props = defineProps<{
  title: string
  payload: Payload
  showSkeleton?: boolean
}>()

const expanded = ref(true)

const payloadContent = computed(() => {
  if (props.payload.type !== 'body') {
    return { formatted: '', language: 'plaintext' }
  }

  try {
    return {
      formatted: JSON.stringify(JSON.parse(props.payload.content), null, 2),
      language: 'json',
    }
  } catch {
    return { formatted: props.payload.content, language: 'plaintext' }
  }
})
</script>

<style lang="scss" scoped>
.payload-display {
  align-items: flex-start;
  display: flex;
  flex-direction: column;

  .title-wrapper {
    align-items: center;
    background-color: $kui-color-background-neutral-weakest;
    border-bottom: 1px solid $kui-color-border-neutral-weaker;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: $kui-space-40 v-bind(WATERFALL_ROW_COLUMN_GAP);
    width: 100%;

    .title {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-semibold;
    }
  }

  .payload-headers {
    width: 100%;

    :deep(.config-card-details-value) {
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-30;

      .copy-text {
        font-size: $kui-font-size-30;
      }
    }

    :deep(.config-card-details-row) {
      column-gap: v-bind(WATERFALL_ROW_COLUMN_GAP);
      display: grid;
      grid-template-columns: 1fr 2fr;
      padding: $kui-space-40 v-bind(WATERFALL_ROW_COLUMN_GAP);

      .config-card-details-label,
      .config-card-details-value {
        padding: 0;
        width: 100%;
      }
    }
  }

  .payload-body {
    padding: $kui-space-60 0;
    width: 100%;
  }
}
</style>
