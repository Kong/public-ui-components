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
    <router-link
      v-else-if="entityUuid"
      target="_blank"
      :to="{ name: routeName, params: routeParams }"
    >
      <div class="entity-link">
        <KTooltip
          :label="((isTruncated && entityLinkData.label) as string)"
        >
          <span
            ref="textContent"
            class="entity-link-label"
          >
            {{ entityLinkData.label }}
          </span>
        </KTooltip>
        <KIcon
          class="entity-link-icon"
          color="currentColor"
          hide-title
          icon="externalLink"
        />
      </div>
    </router-link>
    <CopyUuid
      v-if="entityUuid"
      class="entity-link-copy-id"
      data-testid="copy-id"
      format="hidden"
      :icon-color="KUI_COLOR_TEXT_PRIMARY"
      :notify="notifyCopy"
      :tooltip="t('global.actions.copyId')"
      :use-mono="false"
      :uuid="entityUuid"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType, Ref } from 'vue'
import type { CopyUuidNotifyParam } from '@kong-ui-public/copy-uuid'
import type { RouteParamsRaw } from 'vue-router'
import type { EntityLinkData } from '../../types'
import composables from '../../composables'
import { CopyUuid } from '@kong-ui-public/copy-uuid'
import { KUI_COLOR_TEXT_PRIMARY } from '@kong/design-tokens'

const props = defineProps({
  entityLinkData: {
    type: Object as PropType<EntityLinkData>,
    required: true,
  },
  routeName: {
    type: String,
    required: true,
  },
  routeParams: {
    type: Object as PropType<RouteParamsRaw>,
    required: true,
  },
})

debugger
const textContent = ref<HTMLElement>()
const { isTruncated } = composables.useTruncationDetector(textContent as Ref<HTMLElement>)

const { i18n: { t } } = composables.useI18n()
const { notify } = composables.useToaster()

// If the dimension value is the same as the label, it means the entity has been deleted
const isDeletedEntity = computed(() => {
  return props.entityLinkData.deleted
})

const entityUuid = computed(() => {
  return props.entityLinkData.id.toString().includes(':') ? props.entityLinkData.id.toString().split(':')[1] : props.entityLinkData.id
})

const deletedUuidDisplay = computed(() => {
  // Note: in order for components that use EntityLink to look the same as other
  // Analytics components that just directly render the name from the API,
  // this format needs to be in sync with the backend.
  return `${entityUuid.value.toString().slice(0, 5)} (deleted)`
})

const notifyCopy = (notifyParam: CopyUuidNotifyParam) => {
  if (notifyParam.type === 'success') {
    notify({
      appearance: 'success',
      message: t('global.actions.copied_id', { id: entityUuid.value }),
    })
  } else {
    notify({
      appearance: 'danger',
      message: t('global.actions.copyToClipboardFailed'),
    })
  }
}

</script>

<style lang="scss" scoped>
.kong-ui-public-entity-link {
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

  .entity-link-copy-id {
    margin-left: $kui-space-40;
  }
}
</style>
