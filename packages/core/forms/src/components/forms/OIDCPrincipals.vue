<template>
  <div
    class="oidc-principals-section"
    data-testid="oidc-principals-section"
  >
    <div class="principals-header">
      Who should manage authentication and credentials?
    </div>
    <div class="principals-description">
      Use Consumers for Consumer-based authentication. Use Kong Identity for principal-based authentication and advanced integrations.
      <a
        href="https://developer.konghq.com/kong-identity/"
        target="_blank"
      >Learn more.</a>
    </div>
    <VueFormGenerator
      :model="formModel"
      :options="formOptions"
      :schema="principalsSchema"
      @model-updated="onModelUpdated"
    />
  </div>
</template>

<script>
import VueFormGenerator from '../FormGenerator.vue'

// TODO: check when gateway PR finalized

const PRINCIPALS_FIELD_MODELS = new Set([
  'config-principals-enabled',
  'config-principals-directory',
  'config-principals-principal_by',
  'config-principals-principal_claim',
  'config-principals-match_consumer',
  'config-principals-match_consumer_groups',
  'config-principals-error_on_miss',
])

export default {
  name: 'OIDCPrincipals',
  components: { VueFormGenerator },
  props: {
    formModel: {
      type: Object,
      required: true,
    },
    formSchema: {
      type: Object,
      required: true,
    },
    formOptions: {
      type: Object,
      default: () => ({}),
    },
    onModelUpdated: {
      type: Function,
      required: true,
    },
  },
  computed: {
    principalsSchema() {
      return {
        fields: (this.formSchema.fields || []).filter(
          (field) => PRINCIPALS_FIELD_MODELS.has(field.model),
        ),
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.oidc-principals-section {
  margin-top: var(--kui-space-60, $kui-space-60);
}

.principals-header {
  color: var(--kui-color-text, $kui-color-text);
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  line-height: var(--kui-line-height-40, $kui-line-height-40);
  margin-bottom: var(--kui-space-40, $kui-space-40);
}

.principals-description {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  margin-bottom: var(--kui-space-50, $kui-space-50);

  a {
    display: inline;
  }
}
</style>
