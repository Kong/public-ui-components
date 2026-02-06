<template>
  <Teleport to="#kong-ui-app-layout-teleport-default-slot">
    <KModal
      class="edit-document-modal"
      data-testid="edit-document-modal"
      max-width="750px"
      visible
      @cancel="handleClickCancel"
      @proceed="handleClickSave"
    >
      <template #title>
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
      <template #default>
        <KAlert
          v-if="errorMessage"
          appearance="danger"
          class="bottom-spacing"
          :message="errorMessage"
        />

        <KAlert
          v-if="editing"
          appearance="info"
          class="bottom-spacing"
          :message="i18n.t('documentation.form_modal.edit_markdown')"
          show-icon
        />

        <!-- Show radio buttons only for create modal -->
        <div
          v-if="!editing"
          class="document-radio-group"
        >
          <div>
            <KRadio
              v-model="checkedType"
              class="upload-document-radio"
              data-testid="upload-document-radio"
              selected-value="upload"
            >
              {{ i18n.t('documentation.form_modal.file_label') }}
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="checkedType"
              class="empty-document-radio"
              data-testid="empty-document-radio"
              selected-value="empty"
            >
              {{ i18n.t('documentation.form_modal.empty_doc') }}
            </KRadio>
          </div>
        </div>

        <KFileUpload
          v-if="checkedType === 'upload'"
          :accept="['.md', '.markdown']"
          :button-text="fileUploadButtonText"
          class="document-file-upload"
          data-testid="document-file-upload"
          :label="i18n.t('documentation.form_modal.file_label')"
          :label-attributes="{ info: i18n.t('documentation.form_modal.file_tooltip') }"
          :placeholder="editing ? filePlaceholderText : undefined"
          required
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
              required
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
          class="document-parent-select"
          data-testid="documentation-parent"
          enable-filtering
          :items="availableParentDocuments"
          :label="i18n.t('documentation.form_modal.parent_document_select_label')"
          width="100%"
        />
      </template>

      <template #footer>
        <div class="button-spacing">
          <KButton
            appearance="tertiary"
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
            <ProgressIcon v-if="actionPending" />
            {{ i18n.t('documentation.form_modal.save_button_text') }}
          </KButton>
        </div>
      </template>
    </KModal>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive, watch } from 'vue'
import composables from '../composables'
import { cloneDeep } from '../helpers'
import externalLinks from '../external-links'
import { ProgressIcon } from '@kong/icons'
import type { PropType, Ref } from 'vue'
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
  (e: 'edit', formData: FormData, selectedFile: any): void
  (e: 'cancel'): void
  (e: 'save', formData: FormData, selectedFile: any): void
  (e: 'delete'): void
}>()

const { i18n } = composables.useI18n()
const filePlaceholderText = computed(() => props.record.file?.filename)
const namePlaceholderText = computed(() => selectedFile.value ? selectedFile.value.name?.split('.')[0] : '')
const publishModel = ref<boolean>(true)

const status = computed(() => publishModel.value ? 'published' : 'unpublished')

const checkedType = ref<'empty' | 'upload'>('upload')

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

const availableParentDocuments = computed((): Array<{ label: string, value: string, selected: boolean }> => {
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
  formData.fileName = namePlaceholderText.value
  // Only replace the pageName and urlSlug if not already set
  formData.pageName = formData.pageName ? formData.pageName : namePlaceholderText.value
  formData.urlSlug = formData.urlSlug ? formData.urlSlug : namePlaceholderText.value
}

const saveDisabled = computed((): boolean => {
  // If editing, save button is always enabled
  if (!props.editing) {
    if (checkedType.value === 'upload') {
    // If a file is selected, pageName and urlSlug are required
      return !(selectedFile.value && formData.pageName && formData.urlSlug && !slugError.value)
    } else if (checkedType.value === 'empty') {
    // If no file is selected, only pageName and urlSlug are required
      return !(formData.pageName && formData.urlSlug && !slugError.value)
    }
  }
  return false
})

const handleFileRemoved = (): void => {
  selectedFile.value = null
}

const handleClickCancel = (): void => {
  emit('cancel')
  setForm()
}

const handleClickSave = (): void => {
  const newEmptyFile: Ref<File | null> = ref(null)
  // create the empty file when Empty Documnet is selected
  if (checkedType.value === 'empty') {
    // Create an empty File with .md extension file name
    const newFileContent = new File([], formData.pageName + '.md', {
      type: 'text/markdown',
    })
    newEmptyFile.value = newFileContent

    // If creating Empty Document then emit the save event with new empty file
    emit('save', Object.assign(formData, { fileName: formData.pageName }, { status: status.value }), newEmptyFile.value)
  } else {
    // Else emit the save event with uploaded file
    emit('save', Object.assign(formData, { status: status.value }), selectedFile.value)
  }
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
  }
}

watch(() => checkedType, () => {
  setForm()
}, { deep: true, immediate: true })

onMounted(() => {
  setForm()
})
</script>

<style lang="scss" scoped>
.edit-document-modal {
  .title {
    display: block;
  }

  .subtitle {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  }

  .document-radio-group {
    display: flex;
    margin-bottom: var(--kui-space-80, $kui-space-80);

    .empty-document-radio {
      margin-left: var(--kui-space-80, $kui-space-80);
    }
  }

  .document-inputs {
    display: flex;
    margin-bottom: var(--kui-space-80, $kui-space-80);
    margin-top: var(--kui-space-80, $kui-space-80);
    width: 100%;
  }

  .side-by-side {
    width: 48%;
  }

  .url-slug {
    margin-left: var(--kui-space-auto, $kui-space-auto);
  }

  .bottom-spacing {
    margin-bottom: var(--kui-space-80, $kui-space-80);
  }

  .documentation-status {
    display: block;
    margin-bottom: var(--kui-space-80, $kui-space-80);
    margin-top: var(--kui-space-80, $kui-space-80);
  }

  .document-parent-select {
    margin-top: var(--kui-space-80, $kui-space-80);
  }

  .button-spacing {
    margin-left: var(--kui-space-auto, $kui-space-auto);
  }

  .edit-documentation-delete-button {
    margin-right: var(--kui-space-auto, $kui-space-auto);
  }

  .edit-documentation-cancel-button {
    margin-right: var(--kui-space-40, $kui-space-40);
  }
}
</style>

<style lang="scss">
.edit-document-modal.k-prompt .modal-container {

  // TODO: fix in kongponents
  .document-file-upload {
    margin-bottom: var(--kui-space-80, $kui-space-80);

    .upload-input {
      height: 44px;
    }

    .k-file-upload-btn {
      top: 38px;
    }
  }
}
</style>
