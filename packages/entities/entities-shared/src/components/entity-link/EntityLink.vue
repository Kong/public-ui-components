<template>
  <div
    class="kong-ui-public-entity-link"
    data-testid="entity-link-parent"
  >
    <div
      v-if="isDeletedEntity"
      class="deleted-entity"
    >
      {{ deletedUuidDisplay }}
    </div>
    <div v-else-if="!entityUuid">
      {{ ' – ' }}
    </div>
    <KExternalLink
      v-else-if="entityUuid"
      class="entity-link"
      :href="externalLink"
      target="_blank"
    >
      <KTooltip
        :label="isTruncated && entityLinkData.label || ''"
      >
        <span
          ref="textContent"
          class="entity-link-label"
        >
          {{ entityLinkData.label }}
        </span>
      </KTooltip>
    </KExternalLink>
    <KTooltip
      v-if="entityUuid"
      :key="copyUuidTooltipText"
      class="copy-uuid-tooltip"
      :label="copyUuidTooltipText"
      max-width="160"
      placement="bottomEnd"
    >
      <KClipboardProvider v-slot="{ copyToClipboard }">
        <span
          class="entity-link-copy-id"
          @click.stop="onCopyUuid(copyToClipboard)"
        >
          <CopyIcon
            class="copy-icon"
            :color="KUI_COLOR_TEXT_PRIMARY"
            data-testid="copy-id"
            :size="16"
          />
        </span>
      </KClipboardProvider>
    </KTooltip>
    <!-- <CopyUuid
      v-if="entityUuid"
      data-testid="copy-id"
      format="hidden"
      :icon-color="KUI_COLOR_TEXT_PRIMARY"
      :tooltip="copyUuidTooltipText"
      :use-mono="false"
      :uuid="entityUuid"
      @click.stop="notifyCopy"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import type { EntityLinkData } from '../../types'
import composables from '../../composables'
import { CopyIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_PRIMARY } from '@kong/design-tokens'

const props = defineProps({
  entityLinkData: {
    type: Object as PropType<EntityLinkData>,
    required: true,
  },
  externalLink: {
    type: String,
    required: false,
    default: '',
  },
})

const textContent = ref<HTMLElement>()
const { isTruncated } = composables.useTruncationDetector(textContent as Ref<HTMLElement>)
const { i18n: { t } } = composables.useI18n()

const tooltipDefaultText = t('global.actions.copyId')
const copyUuidTooltipText = ref(tooltipDefaultText)

// If the dimension value is the same as the label, it means the entity has been deleted
const isDeletedEntity = computed(() => {
  return props.entityLinkData.deleted
})

const entityUuid = computed(() => {
  return props.entityLinkData.id.toString().includes(':')
    ? props.entityLinkData.id.toString().split(':')[1]
    : props.entityLinkData.id
})

const deletedUuidDisplay = computed(() => {
  // Note: in order for components that use EntityLink to look the same as other
  // Analytics components that just directly render the name from the API,
  // this format needs to be in sync with the backend.
  return `${entityUuid.value.toString().slice(0, 5)} (deleted)`
})

const onCopyUuid = async (copyToClipboard: (str: string) => Promise<boolean>): Promise<void> => {
  if (await copyToClipboard(entityUuid.value || '')) {
    copyUuidTooltipText.value = t('global.actions.copyToClipboard')

    setTimeout(() => {
      copyUuidTooltipText.value = tooltipDefaultText
    }, 1800)
  }
}

</script>

<style lang="scss" scoped>
.kong-ui-public-entity-link {
  align-items: center;
  display: flex;

  .deleted-entity {
    font-style: italic;
  }

  .entity-link {
    display: flex;

    &-icon {
      color: $kui-color-text-primary;
      margin-left: $kui-space-20;
    }
  }

  .entity-link-label {
    display: inline-block;
    font-weight: $kui-font-weight-regular;
    max-width: 20ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-uuid-tooltip {
    align-items: center;
    display: flex;
    .entity-link-copy-id {
      margin-left: $kui-space-30;
    }
  }
}
</style>
