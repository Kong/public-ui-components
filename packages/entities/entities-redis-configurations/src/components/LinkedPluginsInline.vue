<template>
  <div
    class="linked-plugins"
    data-testid="linked-plugins-inline"
  >
    <template
      v-for="link in links.slice(0, SHOW_COUNT)"
      :key="link.id"
    >
      <PluginIcon
        :name="link.name"
        :size="24"
      />
    </template>
    <KBadge
      v-if="links.length - SHOW_COUNT > 0"
      appearance="info"
    >
      +{{ links.length - SHOW_COUNT }}
    </KBadge>
  </div>
</template>

<script setup lang="ts">
import { PluginIcon } from '@kong-ui-public/entities-plugins'
import { useLinkedPlugins } from '../composables/useLinkedPlugins'
import type { PropType } from 'vue'
import {
  type KongManagerConfig,
  type KonnectConfig,
  AppType,
} from '@kong-ui-public/entities-shared'

const props = defineProps({
  config: {
    type: Object as PropType<KonnectConfig | KongManagerConfig>,
    required: true,
    validator: (config: KonnectConfig | KongManagerConfig) => {
      if (!config || ![AppType.Konnect, AppType.KongManager].includes(config?.app)) return false
      if (config.app === AppType.Konnect && !config.controlPlaneId) return false
      if (config.app === AppType.KongManager && typeof config.workspace !== 'string') return false
      return true
    },
  },
  partialId: {
    type: String,
    required: true,
  },
})

const SHOW_COUNT = 7 // todo(zehao): make it responsive?

const links = useLinkedPlugins({
  config: props.config,
  partialId: props.partialId,
})

</script>


<style scoped lang="scss">
.linked-plugins {
  display: flex;
  gap: $kui-space-40;
}
</style>
