<template>
  <section
    class="labels"
    data-testid="labels-list"
  >
    <div
      v-if="labels.length && labels[0].value"
      class="labels-list"
    >
      <KTruncate>
        <KTooltip
          v-for="item in labels"
          :key="item.id"
          position-fixed
        >
          <KBadge
            appearance="neutral"
            class="label-list-badge"
            :is-bordered="showBadgeBorders"
            :max-width="showAllLabels ? 'auto' : '190px'"
            shape="rectangular"
          >
            {{ item.key }}:<b>{{ `${item.value}` }}</b>
          </KBadge>

          <template #content>
            <span>{{ item.key }}:<b>{{ `${item.value}` }}</b></span>
          </template>
        </KTooltip>
      </KTruncate>
    </div>

    <span
      v-else
      class="empty-wrapper"
    >
      {{ i18n.t('label_list.no_labels') }}
    </span>

    <PermissionsWrapper
      :auth-function="() => canEdit()"
    >
      <KTooltip
        class="edit-wrapper"
        :label="i18n.t('label_list.edit_button_text')"
        placement="top"
        position-fixed
      >
        <KButton
          appearance="tertiary"
          class="edit-button"
          :class="{ 'no-labels': !labels.length }"
          data-testid="edit-button-label"
          size="small"
          type="button"
          @click="setToggleModal"
        >
          <EditIcon
            :color="KUI_COLOR_TEXT_NEUTRAL"
            :size="KUI_ICON_SIZE_30"
          />
        </KButton>
      </KTooltip>
    </PermissionsWrapper>

    <Teleport
      v-if="openModal"
      to="#kong-ui-app-layout-teleport-default-slot"
    >
      <LabelsModal
        v-if="openModal"
        :id="id"
        data-testid="edit-labels-modal"
        :labels="labels"
        :name="name"
        :open-modal="openModal"
        :scope="scope"
        @revalidate="revalidate"
        @set-toggle-modal="setToggleModal"
      />
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import LabelsModal from './LabelModal.vue'
import composables from '../composables'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { EditIcon } from '@kong/icons'
import { LabelScope } from '../enums'
import { PermissionsWrapper } from '@kong-ui-public/entities-shared'

import type { PropType } from 'vue'
import type { Label } from 'src/types'

const props = defineProps({
  labels: {
    type: Array as PropType<Label[]>,
    default: () => [],
  },
  /**
   * A synchronous or asynchronous function which returns a boolean evaluating
   * if the user can edit an entity by create a new document
   */
  canEdit: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => false,
  },
  name: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  isEditEnabled: {
    type: Boolean,
    default: true,
  },
  scope: {
    type: String,
    default: LabelScope.RUNTIME_GROUP,
    validator: (val: LabelScope) => [LabelScope.RUNTIME_GROUP, LabelScope.SERVICE_HUB].includes(val),
  },
  showModal: {
    type: Boolean,
    default: false,
  },
  showBadgeBorders: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['set-toggle-modal', 'revalidate'])

const showAllLabels = ref(false)
const openModal = ref(false)
const { i18n } = composables.useI18n()

const setToggleModal = (): void => {
  openModal.value = !openModal.value
  emit('set-toggle-modal')
}

const revalidate = (): void => {
  emit('revalidate')
}

watch(() => props.showModal, (newVal) => {
  openModal.value = newVal
})
</script>

<style lang="scss" scoped>
.labels {
  align-items: center;
  display: flex;

  .edit-wrapper {
    display: flex;
  }

  .k-button.edit-button.small {
    align-self: center;
    padding: $kui-space-0;
  }

  .labels-list {
    align-items: center;
    -webkit-box-direction: normal;
    -webkit-box-orient: horizontal;
    column-gap: $kui-space-30;
    display: flex;
    flex-flow: row wrap;
    row-gap: $kui-space-30;

    .empty-wrapper {
      vertical-align: top;
    }

    .k-badge {
      &.label-list-badge-collapse {
        height: 20px;
        padding-top: $kui-space-40;
        width: 22px;
      }
    }

    .label-list-badge.k-badge {
      display: block;

      &:hover {
        cursor: default;
      }
    }

    .k-badge-wrapper {
      .label-list-button-collapse {
        border: none;
        cursor: pointer;
        height: 20px;
      }
    }
  }
}
</style>
