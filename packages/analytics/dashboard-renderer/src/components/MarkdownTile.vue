<template>
  <div
    class="tile-boundary"
    :class="{ editable: context.editable }"
    :data-testid="`tile-${tileId}`"
  >
    <div
      v-if="hasTileHeader"
      class="tile-header"
    >
      <div class="tile-actions">
        <EditIcon
          class="edit-icon"
          :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
          :data-testid="`edit-tile-${tileId}`"
          :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
          @click="emit('edit-tile')"
        />
        <KDropdown
          class="dropdown"
          :data-testid="`chart-action-menu-${tileId}`"
          :kpop-attributes="{ placement: 'bottom-end' }"
        >
          <MoreIcon
            class="kebab-action-menu"
            :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
            :data-testid="`kebab-action-menu-${tileId}`"
            :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
          />
          <template #items>
            <KDropdownItem
              :data-testid="`duplicate-tile-${tileId}`"
              @click="emit('duplicate-tile')"
            >
              {{ i18n.t('renderer.duplicateTile') }}
            </KDropdownItem>
            <KDropdownItem
              :data-testid="`remove-tile-${tileId}`"
              @click="emit('remove-tile')"
            >
              <span class="delete-option">{{ i18n.t('renderer.delete') }}</span>
            </KDropdownItem>
          </template>
        </KDropdown>
      </div>
    </div>
    <div class="tile-content">
      <MarkdownTileRenderer :content="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardRendererContextInternal } from '../types'
import { EditIcon, MoreIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import MarkdownTileRenderer from './MarkdownTileRenderer.vue'
import composables from '../composables'

const props = withDefaults(defineProps<{
  content: string
  context: DashboardRendererContextInternal
  hideActions?: boolean
  isFullscreen?: boolean
  tileId: string | number
}>(), {
  hideActions: false,
  isFullscreen: false,
})

const emit = defineEmits<{
  (e: 'edit-tile'): void
  (e: 'duplicate-tile'): void
  (e: 'remove-tile'): void
}>()

const { i18n } = composables.useI18n()

const hasTileHeader = computed(() => props.context.editable && !props.isFullscreen && !props.hideActions)
</script>

<style scoped lang="scss">
.tile-boundary {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &.editable:hover {
    .tile-header {
      background: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    }
  }

  .tile-header {
    align-items: center;
    display: flex;
    justify-content: flex-end;
    padding: var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);
    width: 100%;

    .tile-actions {
      display: flex;
      gap: var(--kui-space-30, $kui-space-30);

      .edit-icon {
        cursor: pointer;
      }
    }

    .dropdown {
      display: flex;

      .kebab-action-menu {
        cursor: pointer;
      }

      .delete-option {
        color: var(--kui-color-text-danger, $kui-color-text-danger);
      }
    }
  }

  .tile-content {
    flex-grow: 1;
    overflow: hidden;
  }
}
</style>
