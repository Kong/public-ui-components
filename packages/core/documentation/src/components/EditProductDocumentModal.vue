<template>
  <Teleport
    v-if="showEditModal"
    to="#kong-ui-app-layout-teleport-default-slot"
  >
    <KPrompt
      class="edit-document-modal"
      data-testid="edit-document-modal"
      :is-visible="showEditModal"
      @canceled="$emit('canceled')"
      @proceed="emit('save')"
    >
      <template #header-content>
        <div class="title">
          {{ titleText }}
          <div class="subtitle">
            {{ i18n.t('documentation.form_modal.subtitle') }}
            <br>
            <KExternalLink
              class="doc-link"
              :href="externalLinks.serviceDocumentationDocs"
            >
              {{ i18n.t('documentation.form_modal.documentation_link_text') }}
            </KExternalLink>
          </div>
        </div>
      </template>
      <template #body-content>
        <KAlert
          v-if="errorMessage"
          :alert-message="errorMessage"
          appearance="danger"
          class="bottom-spacing"
        />

        <!-- TODO: help tooltip-->
        <KFileUpload
          :accept="['.md', '.markdown']"
          :button-text="fileUploadButtonText"
          class="document-file-upload"
          data-testid="document-file-upload"
          :label="i18n.t('documentation.form_modal.file_label')"
          :label-attributes="{ help: i18n.t('documentation.form_modal.file_tooltip') }"
          :placeholder="isEditing ? filePlaceholderText : undefined"
          @file-added="handleFileSelected"
          @file-removed="handleFileRemoved"
        />

        <div class="document-inputs">
          <div class="page-name side-by-side">
            <KInput
              v-model="formData.pageName"
              data-testid="documentation-page-name"
              :label="i18n.t('documentation.form_modal.title_label')"
              required
            />
          </div>
          <div class="url-slug side-by-side">
            <KInput
              v-model="formData.urlSlug"
              data-testid="documentation-url-slug"
              :error-message="i18n.t('documentation.form_modal.slug_error')"
              :has-error="slugError"
              :label="i18n.t('documentation.form_modal.slug_label')"
              :pattern="slugRegex"
            />
          </div>
        </div>

        <div class="documentation-status">
          <div>
            <KLabel>
              {{ i18n.t('documentation.form_modal.status_label') }}
            </KLabel>
          </div>
          <KInputSwitch
            v-model="formData.status"
            data-testid="documentation-status"
            :label="publishedStatusText"
          />
        </div>

        <KSelect
          v-model="formData.parent"
          appearance="select"
          class="document-parent-select"
          data-testid="documentation-parent"
          enable-filtering
          :items="availableParentDocuments"
          :label="i18n.t('documentation.form_modal.parent_document_select_label')"
          width="100%"
        />
      </template>

      <template #action-buttons>
        <div class="action-buttons">
          <KButton
            v-if="isEditing"
            appearance="danger"
            class="edit-documentation-delete-button"
            data-testid="edit-documentation-delete-button"
            :disabled="state.matches('pending')"
            :icon="state.matches('pending') ? 'spinner' : undefined"
            @click="emit('delete')"
          >
            {{ i18n.t('documentation.form_modal.delete_button_text') }}
          </KButton>

          <div class="button-spacing">
            <KButton
              appearance="outline"
              class="edit-documentation-cancel-button"
              data-testid="edit-documentation-cancel-button"
              @click="handleClickCancel"
            >
              {{ i18n.t('documentation.form_modal.cancel_button_text') }}
            </KButton>
            <KButton
              appearance="primary"
              data-testid="edit-documentation-save-button"
              :disabled="state.matches('pending') || saveDisabled"
              :icon="state.matches('pending') ? 'spinner' : undefined"
              @click="emit('save')"
            >
              {{ i18n.t('documentation.form_modal.save_button_text') }}
            </KButton>
          </div>
        </div>
      </template>
    </KPrompt>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { createMachine } from 'xstate'
import { useMachine } from '@xstate/vue'
import composables from '../composables'
import { cloneDeep } from '../helpers'
import externalLinks from '../external-links'

import type { PropType } from 'vue'

const props = defineProps({
  showEditModal: {
    type: Boolean,
    default: false,
  },
  servicePackageId: {
    type: String,
    required: true,
  },
  documentId: {
    type: String,
    required: true,
  },
  record: {
    // TODO: type
    type: Object,
    default: null,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  // TODO: type
  documents: {
    type: Array as PropType<{ label: string, value: string, selected: boolean }[]>,
    required: true,
  },
})

const emit = defineEmits(['canceled', 'save', 'delete'])

const { i18n } = composables.useI18n()
const filePlaceholderText = computed(() => props.record.file?.filename)
const namePlaceholderText = computed(() => selectedFile.value ? selectedFile.value.name?.split('.')[0] : '')

const { state, send } = useMachine(createMachine({
  predictableActionArguments: true,
  id: 'UPDATE_SERVICE_DOCUMENTATION',
  initial: 'idle',
  states: {
    idle: {
      on: { CLICK_EDIT: 'pending', CLICK_DELETE: 'pending' },
    },
    pending: {
      on: { RESOLVE: 'idle', REJECT: 'error' },
    },
    error: {
      on: { CLICK_EDIT: 'pending', CLICK_CANCEL: 'idle', CLICK_DELETE: 'pending' },
    },
  },
}))

const formData = reactive({
  fileName: '',
  pageName: '',
  urlSlug: '',
  status: true,
  parent: '',
})

const slugRegex: RegExp = /^[\w-]+$/
const slugError = computed((): boolean => {
  return formData.urlSlug !== '' && !formData.urlSlug?.match(slugRegex)
})

const availableParentDocuments = computed((): { label: string, value: string, selected: boolean }[] => {
  // TODO: type document
  let docs = props.documents?.filter((document: any) => document.record.id !== props.record?.id && !document.record.parent_document_id)
    .map((document: any) => ({
      label: document.record.title,
      value: document.record.id,
      selected: false,
    }))

  if (!docs) {
    docs = []
  }

  const docCount = cloneDeep(docs.length)

  docs.push({
    label: i18n.t('documentation.form_modal.parent_document_select_option_none'),
    value: 'none',
    // @ts-ignore
    selected: !docCount ? true : undefined,
  })

  return docs
})

const saveDisabled = computed((): boolean => (!props.isEditing && !selectedFile.value) || !formData.pageName || slugError.value)

const titleText = computed((): string => {
  return props.isEditing
    ? i18n.t('documentation.form_modal.edit_title')
    : i18n.t('documentation.form_modal.create_title')
})

const fileUploadButtonText = computed((): string => {
  return props.isEditing
    ? i18n.t('documentation.form_modal.replace_file_button_text')
    : i18n.t('documentation.form_modal.filename_button_text')
})

const publishedStatusText = computed((): string => {
  return formData.status
    ? i18n.t('documentation.form_modal.status.published')
    : i18n.t('documentation.form_modal.status.unpublished')
})

const selectedFile = ref<any>(null)
const handleFileSelected = (file: any): void => {
  selectedFile.value = file?.[0]
  formData.pageName = namePlaceholderText.value
  formData.urlSlug = namePlaceholderText.value
  formData.fileName = namePlaceholderText.value
}

const handleFileRemoved = (): void => {
  selectedFile.value = null
}

const handleClickCancel = (): void => {
  resetForm()
  send('CLICK_CANCEL')
  emit('canceled')
}

const errorMessage = ref<string>('')

const resetForm = (): void => {
  errorMessage.value = ''
  selectedFile.value = null

  if (props.isEditing && props.record) {
    formData.fileName = cloneDeep(props.record.file?.filename)
    formData.pageName = cloneDeep(props.record.title)
    formData.urlSlug = cloneDeep(props.record.slug)
    formData.parent = cloneDeep(props.record.parent_document_id)
    formData.status = props.record.status === 'published'
  } else {
    formData.fileName = ''
    formData.pageName = ''
    formData.urlSlug = ''
    formData.parent = ''
    formData.status = true
  }
}

watch(() => props.record, () => {
  resetForm()
})
</script>

<style lang="scss" scoped>
  .edit-document-modal {
    & :deep(.k-modal-dialog) {
      max-width: 750px;
    }
    .title {
      display: block;
    }

    .subtitle {
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-regular;
    }

    .doc-link {
      display: inline;
    }

    .document-inputs {
      display: flex;
      margin-bottom: $kui-space-80;
      margin-top: $kui-space-80;
      width: 100%;
    }

    .side-by-side {
      width: 48%;
    }

    .url-slug {
      margin-left: $kui-space-auto;
    }

    .bottom-spacing {
      margin-bottom: $kui-space-80;
    }

    .documentation-status {
      display: block;
      margin-bottom: $kui-space-80;
      margin-top: $kui-space-80;
    }

    .document-parent-select {
      margin-top: $kui-space-80;
    }

    .action-buttons {
      display: flex;
      width: 100%;
    }

    .button-spacing {
      margin-left: $kui-space-auto;
    }

    .edit-documentation-delete-button {
      margin-right: $kui-space-auto;
    }
    .edit-documentation-cancel-button {
      margin-right: $kui-space-40;
    }

    .k-prompt .k-modal-dialog.modal-dialog .k-modal-content .k-modal-footer.modal-footer .k-prompt-action-buttons {
      width: 100%;
    }
  }
</style>

<style lang="scss">
  .edit-document-modal.k-prompt .k-modal-dialog.modal-dialog {
    .close-button {
      align-self: start;
    }
    // TODO: fix in kongponents
    .document-file-upload {
      margin-bottom: $kui-space-80;
      .upload-input {
        height: 44px;
      }

      .k-file-upload-btn {
        top: 38px;
      }
    }

    .k-modal-content .k-modal-footer.modal-footer .k-prompt-action-buttons {
      width: 100%;
    }
  }
</style>
