<template>
  <Teleport
    to="#kong-ui-app-layout-teleport-default-slot"
  >
    <KPrompt
      class="edit-document-modal"
      data-testid="edit-document-modal"
      is-visible
      @canceled="handleClickCancel"
      @proceed="handleClickSave"
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

        <KFileUpload
          :accept="['.md', '.markdown']"
          :button-text="fileUploadButtonText"
          class="document-file-upload"
          data-testid="document-file-upload"
          :label="i18n.t('documentation.form_modal.file_label')"
          :label-attributes="{ help: i18n.t('documentation.form_modal.file_tooltip') }"
          :placeholder="editing ? filePlaceholderText : undefined"
          @file-added="handleFileSelected"
          @file-removed="handleFileRemoved"
        />

        <div class="document-inputs">
          <div class="page-name side-by-side">
            <KInput
              v-model.trim="formData.pageName"
              data-testid="documentation-page-name"
              :label="i18n.t('documentation.form_modal.title_label')"
              :placeholder="i18n.t('documentation.form_modal.title_placeholder')"
              required
            />
          </div>
          <div class="url-slug side-by-side">
            <KInput
              v-model.trim="formData.urlSlug"
              data-testid="documentation-url-slug"
              :error-message="i18n.t('documentation.form_modal.slug_error')"
              :has-error="slugError"
              :label="i18n.t('documentation.form_modal.slug_label')"
              :pattern="slugRegex"
              :placeholder="i18n.t('documentation.form_modal.slug_placeholder')"
            />
          </div>
        </div>

        <div
          v-if="!hidePublishToggle"
          class="documentation-status"
        >
          <div>
            <KLabel>
              {{ i18n.t('documentation.form_modal.status_label') }}
            </KLabel>
          </div>
          <KInputSwitch
            v-model="publishModel"
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
            v-if="editing"
            appearance="danger"
            class="edit-documentation-delete-button"
            data-testid="edit-documentation-delete-button"
            :disabled="actionPending"
            @click="emit('delete')"
          >
            <template
              v-if="actionPending"
              #icon
            >
              <ProgressIcon
                size="16"
              />
            </template>
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
              :disabled="actionPending || saveDisabled"
              @click="handleClickSave"
            >
              <template
                v-if="actionPending"
                #icon
              >
                <ProgressIcon
                  size="16"
                />
              </template>
              {{ i18n.t('documentation.form_modal.save_button_text') }}
            </KButton>
          </div>
        </div>
      </template>
    </KPrompt>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import composables from '../composables'
import { cloneDeep } from '../helpers'
import externalLinks from '../external-links'
import { ProgressIcon } from '@kong/icons'

import type { PropType } from 'vue'
import type { DocumentListItem, FormData } from 'src/types'

const props = defineProps({
  actionPending: {
    type: Boolean,
    default: false,
  },
  documents: {
    type: Array as PropType<DocumentListItem[]>,
    required: true,
  },
  editing: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  hidePublishToggle: {
    type: Boolean,
    default: false,
  },
  record: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'cancel'): void,
  (e: 'save', formData: FormData, selectedFile: any): void,
  (e: 'delete'): void,
}>()

const { i18n } = composables.useI18n()
const filePlaceholderText = computed(() => props.record.file?.filename)
const namePlaceholderText = computed(() => selectedFile.value ? selectedFile.value.name?.split('.')[0] : '')
const publishModel = ref<boolean>(false)

const status = computed(() => publishModel.value ? 'published' : 'unpublished')

const formData = reactive({
  fileName: '',
  pageName: '',
  urlSlug: '',
  status: status.value,
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
    selected: !docCount,
  })

  return docs
})

const saveDisabled = computed((): boolean => (!props.editing && !selectedFile.value) || !formData.pageName || slugError.value)

const titleText = computed((): string => {
  return props.editing
    ? i18n.t('documentation.form_modal.edit_title')
    : i18n.t('documentation.form_modal.create_title')
})

const fileUploadButtonText = computed((): string => {
  return props.editing
    ? i18n.t('documentation.form_modal.replace_file_button_text')
    : i18n.t('documentation.form_modal.filename_button_text')
})

const publishedStatusText = computed((): string => {
  return status.value === 'published'
    ? i18n.t('documentation.common.published')
    : i18n.t('documentation.common.unpublished')
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
  emit('cancel')
  setForm()
}

const handleClickSave = (): void => {
  emit('save', Object.assign(formData, { status: status.value }), selectedFile)
}

const setForm = (): void => {
  selectedFile.value = null

  if (props.editing && props.record?.document) {
    const record = cloneDeep(props.record)
    const status = record.status || props.record.document.status || publishModel.value

    formData.fileName = record.document.file?.filename || record.document.revision?.file?.filename
    formData.pageName = record.document.title || record.document.revision?.title
    formData.urlSlug = record.document.slug
    formData.parent = record.document.parent_document_id
    formData.status = status
    publishModel.value = status === 'published'
  } else {
    formData.fileName = ''
    formData.pageName = ''
    formData.urlSlug = ''
    formData.parent = ''
    formData.status = ''
    publishModel.value = false
  }
}

onMounted(() => {
  setForm()
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
