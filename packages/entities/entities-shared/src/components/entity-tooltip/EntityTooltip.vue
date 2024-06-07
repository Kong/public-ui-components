<template>
  <KPop
    placement="bottom"
    trigger="hover"
    width="300"
  >
    <div class="label-wrapper">
      <ConnectionsIcon :size="KUI_ICON_SIZE_30" />
      <span class="label">{{ tooltipData?.label }}</span>
    </div>
    <template
      v-if="tooltipData?.items"
      #content
    >
      <ConfigCardItem
        v-for="item in tooltipData.items"
        :key="item.key"
        :item="item"
        slim
        truncated
      />
    </template>
    <template #footer>
      <div class="footer-container">
        <EntityLink
          allow-copy
          :entity-link-data="{
            id: entityConfig.id,
            label: 'View',
            deleted: entityDeleted
          }"
          :external-link="externalLink"
          new-window
        />
        <KExternalLink
          v-if="exploreLink"
          :href="exploreLink"
        >
          Explore
        </KExternalLink>
      </div>
    </template>
  </KPop>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ref } from 'vue'
import ConfigCardItem from '../entity-base-config-card/ConfigCardItem.vue'
import useSWRV from 'swrv'
import EntityLink from '../entity-link/EntityLink.vue'
import { ConnectionsIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import type { EntityTooltipConfig, TooltipData } from '../../types'

const props = defineProps({
  entityConfig: {
    type: Object as PropType<EntityTooltipConfig>,
    required: true,
  },
  externalLink: {
    type: String,
    required: true,
  },
  exploreLink: {
    type: String,
    required: false,
    default: null,
  },
})

const entityDeleted = ref(false)

const { data: tooltipData } = useSWRV<TooltipData>(
  () => `entity-tooltip-${props.entityConfig.id}`,
  async () => {

    const items = await props.entityConfig.data()

    return items
  },
  {
    refreshInterval: 0,
    revalidateOnFocus: false,
  },
)
</script>

<style lang="scss" scoped>
:deep(.config-card-details-row) {
  padding: $kui-space-30 $kui-space-0 $kui-space-30 0 !important;
}

:deep(.config-card-details-value) {
  display: flex !important;
  justify-content: end !important;
  overflow: hidden;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  width: 60% !important;

  .copy-text {
    max-width: 15ch !important;
    overflow: hidden;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
}

:deep(.config-card-details-label) {
  width: 40% !important;
}

.label-wrapper {
  display: flex;
  flex-direction: row;
  gap: $kui-space-20;

  .label {
    cursor: pointer;
    text-decoration: underline;
    text-decoration-style: dashed;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
}

.footer-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
