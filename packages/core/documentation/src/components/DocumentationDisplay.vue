<template>
  <div class="documentation-display">
    <div class="document-meta">
      <div class="document-title meta-section">
        <slot name="document-title">
          <span>{{ fileName }}</span>.<span class="document-title-extension">md</span>
        </slot>
      </div>

      <div
        v-if="!hidePublishToggle"
        class="document-status meta-section"
      >
        <span class="meta-label">{{ i18n.t('documentation.documentation_display.status_label') }}</span>
        <KBadge
          v-if="publishModel"
          appearance="success"
          is-bordered
        >
          {{ i18n.t('documentation.common.published') }}
        </KBadge>
        <KBadge
          v-else
          appearance="neutral"
          is-bordered
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
          appearance="neutral"
          class="badge-modified"
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
            v-if="!hidePublishToggle && !card"
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
            @click="emit('edit')"
          >
            {{ i18n.t('documentation.documentation_display.edit_button') }}
          </KButton>
          <KButton
            appearance="primary"
            data-testid="add-new-page-button"
            size="small"
            @click="emit('add')"
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
        v-if="!card"
        class="markdown-content-loader"
      />

      <KSkeleton
        v-else
        type="card"
      />
    </div>

    <div v-else>
      <div
        class="document-content"
        :class="{ 'content-card-view': card }"
      >
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
import { isObjectEmpty } from '../helpers'
import { PermissionsWrapper } from '@kong-ui-public/entities-shared'
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
  card: {
    type: Boolean,
    default: false,
  },
  hidePublishToggle: {
    type: Boolean,
    default: false,
  },
  selectedDocument: {
    type: Object as PropType<{ document: DocumentTree, ast: Object, status: 'published' | 'unpublished'}>,
    default: () => null,
  },
})

const emit = defineEmits<{
  (e: 'add'): void,
  (e: 'edit'): void,
  (e: 'toggle-published', newValue: boolean): void,
}>()

const { i18n } = composables.useI18n()
const isLoading = ref(true)
const fileName = computed((): string => props.selectedDocument?.document?.title || props.selectedDocument?.document?.revision?.title || '')
const createdAt = computed((): string => '')
const publishModel = ref<boolean>(false)
const publishedStatusText = ref(i18n.t('documentation.common.unpublished'))
const defaultDocument = ref<any>(null)

watch(() => props.selectedDocument, (newVal) => {
  if (!isObjectEmpty(newVal)) {
    if (!props.hidePublishToggle) {
      setStatus(newVal.document?.status)
    }

    if (newVal.ast) {
      handleDocument()
    }
  }
}, { deep: true })

const handlePublishToggle = (): void => {
  const newValue = !publishModel.value

  emit('toggle-published', newValue)
  publishModel.value = newValue
  publishedStatusText.value = newValue
    ? i18n.t('documentation.common.published')
    : i18n.t('documentation.common.unpublished')
}

const setStatus = (status?: string): void => {
  if (status === 'published') {
    publishModel.value = true
    publishedStatusText.value = i18n.t('documentation.common.published')
  } else {
    publishModel.value = false
    publishedStatusText.value = i18n.t('documentation.common.unpublished')
  }
}

const handleDocument = () => {
  defaultDocument.value = {
    children: props.selectedDocument.ast,
    type: 'document',
    version: 1,
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
}
</style>
