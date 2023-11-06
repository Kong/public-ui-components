<template>
  <div class="documentation-display">
    <div class="document-meta">
      <div class="document-title meta-section">
        <slot name="document-title">
          <span>{{ fileName }}</span>.<span class="document-title-extension">md</span>
        </slot>
      </div>

      <div class="document-status meta-section">
        <span class="meta-label">{{ i18n.t('documentation.documentation_display.status_label') }}</span>
        <KBadge
          v-if="publishModel"
          appearance="success"
          class="badge-modified"
        >
          {{ i18n.t('documentation.common.published') }}
        </KBadge>
        <KBadge
          v-else
          :background-color="KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER"
          class="badge-modified"
          :color="KUI_COLOR_TEXT_NEUTRAL"
        >
          {{ i18n.t('documentation.common.unpublished') }}
        </KBadge>
      </div>

      <div
        v-if="createdAt"
        class="document-create meta-section"
      >
        <span class="meta-label">{{ i18n.t('documentation.documentation_display.added_label') }}</span>
        <KBadge
          :background-color="KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER"
          class="badge-modified"
          :color="KUI_COLOR_TEXT_NEUTRAL"
        >
          {{ createdAt }}
        </KBadge>
      </div>

      <div
        class="document-display-actions"
      >
        <PermissionsWrapper
          :auth-function="() => canEdit()"
        >
          <KInputSwitch
            v-if="!isCard"
            v-model="publishModel"
            class="document-publish-toggle"
            data-testid="document-publish-toggle"
            :label="publishedStatusText"
            label-position="left"
            @click="handlePublishToggle"
          />
          <KButton
            appearance="secondary"
            class="document-edit-button"
            data-testid="document-edit-button"
            size="small"
            @click="emit('edit-clicked')"
          >
            {{ i18n.t('documentation.documentation_display.edit_button') }}
          </KButton>
          <KButton
            appearance="primary"
            data-testid="add-new-page-button"
            size="small"
            @click="emit('add-clicked')"
          >
            {{ i18n.t('documentation.documentation_display.add_new') }}
          </KButton>
        </PermissionsWrapper>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="markdown-content-loading"
      data-testid="markdown-content-loading"
    >
      <KSkeleton
        v-if="!isCard"
        class="markdown-content-loader"
      />

      <KSkeleton
        v-else
        type="card"
      />
    </div>

    <div v-else>
      <div :class="['document-content', isCard ? 'content-card-view' : '']">
        <DocumentViewer
          v-if="defaultDocument"
          :document="defaultDocument"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import composables from '../composables'
import DocumentViewer from '@kong-ui-public/document-viewer'
import { KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER, KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import '@kong-ui-public/document-viewer/dist/style.css'
import type { PropType } from 'vue'
import type { DocumentTree } from '../types'

const props = defineProps({
  /**
   * A synchronous or asynchronous function which returns a boolean evaluating
   * if the user can edit an entity by create a new document
   */
  canEdit: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => false,
  },
  /**
   * The abstract syntax tree content for the document to be displayed
   */
  documentAst: {
    type: Array,
    required: true,
  },
  /**
   * The publish status of the document to be displayed
   */
  documentStatus: {
    type: String,
    required: true,
  },
  isCard: {
    type: Boolean,
    default: false,
  },
  record: {
    type: Object as PropType<DocumentTree>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'add-clicked'): void,
  (e: 'edit-clicked'): void,
  (e: 'toggle-published', newValue: boolean): void,
}>()

const { i18n } = composables.useI18n()
const isLoading = ref(true)
const fileName = computed((): string => props.record.title || '')
const createdAt = computed((): string => '')
const publishModel = ref<boolean>(false)
const publishedStatusText = ref(i18n.t('documentation.common.unpublished'))
const error = ref('')
const defaultDocument = ref<any>(null)

const handlePublishToggle = (): void => {
  const newValue = !publishModel.value

  emit('toggle-published', newValue)
  publishModel.value = newValue
  publishedStatusText.value = newValue
    ? i18n.t('documentation.common.published')
    : i18n.t('documentation.common.unpublished')
}

const setStatus = (status: string | undefined): void => {
  if (status === 'published') {
    publishModel.value = true
    publishedStatusText.value = i18n.t('documentation.common.published')
  } else {
    publishModel.value = false
    publishedStatusText.value = i18n.t('documentation.common.unpublished')
  }
}

watch(() => props.record, (newVal) => {
  setStatus(newVal.status)
})

watch(() => props.documentAst, (newVal) => {
  if (newVal) {
    handleDocument()
  }
}, { deep: true })

watch(() => props.documentStatus, (newVal) => {
  if (newVal) {
    setStatus(newVal)
  }
})

const handleDocument = () => {
  if (props.documentAst) {
    defaultDocument.value = {
      children: props.documentAst,
      type: 'document',
      version: 1,
    }
  } else {
    error.value = i18n.t('documentation.errors.cannot_retrieve_document')
  }

  isLoading.value = false
}
</script>

<style lang="scss" scoped>
.document-content {
  min-height: 450px; // fixes flaky jump when markdown content loads and renders, changing height of the container
  padding: $kui-space-80;
}

.markdown-content-loading :deep(.skeleton-card-column) {
  margin-bottom: $kui-space-0;
}

.markdown-content-loading :deep(.skeleton-card) {
  min-height: 450px; // fixes flaky jump when markdown content loads and renders, changing height of the container
}
.content-card-view {
  @media (min-width: $kui-breakpoint-phablet) {
    max-height: 450px;
    overflow-y: scroll;
  }
}

.documentation-display {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-20;

  .document-meta {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    padding: 10px $kui-space-60;
  }

  .meta-section {
    align-self: center;
  }

  .meta-label {
    color: $kui-color-text-neutral;
  }

  .document-title {
    color: #0b172d;
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-bold;
    margin-right: $kui-space-50;
    &-extension {
      color: $kui-color-text-neutral;
    }
  }

  .document-status {
    margin-right: $kui-space-50;
  }

  .document-display-actions {
    margin-left: $kui-space-auto;
  }

  .document-publish-toggle {
    margin-right: $kui-space-80;
  }

  .document-edit-button {
    margin-right: $kui-space-40;
  }

  .markdown-content-loader {
    margin-bottom: $kui-space-80;
  }

  .k-badge {
    &.k-badge-default.badge-modified {
      border: $kui-border-width-10 solid $kui-color-border;
    }

    &.k-badge-success.badge-modified {
      border: $kui-border-width-10 solid #c0f2d5;
    }
  }
}
</style>
