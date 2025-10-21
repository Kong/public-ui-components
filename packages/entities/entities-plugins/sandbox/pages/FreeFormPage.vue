<template>
  <Form
    class="form"
    :schema="buildMockingSchema()"
    @change="console.log"
  >
    <template #[FIELD_RENDERERS]>
      <FieldRenderer
        v-slot="props"
        :match="({ path }) => path.startsWith('editor_')"
      >
        <EditorField
          v-bind="props"
          autosize
          :language="(props.name.split('_')[1] as 'json' | 'lua' | 'yaml' | 'plaintext')"
        />
      </FieldRenderer>
    </template>
  </Form>
</template>

<script lang="ts" setup>
import { buildMockingSchema } from '../../fixtures/schemas/free-form-mocking'
import Form from '../../src/components/free-form/shared/Form.vue'
import { FIELD_RENDERERS } from '../../src/components/free-form/shared/composables'
import FieldRenderer from '../../src/components/free-form/shared/FieldRenderer.vue'
import EditorField from '../../src/components/free-form/shared/EditorField.vue'


import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    return new editorWorker()
  },
}

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto;
  max-width: 100%;
  padding: 20px;
  width: 800px;
}
</style>
