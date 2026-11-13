<template>
  <KAlert
    v-if="checks"
    data-testid="ff-entity-checks-alert"
  >
    <ul class="ff-entity-checks-list">
      <li
        v-for="check in checks"
        :key="check.key"
        data-testid="ff-entity-check-item"
      >
        <i18nT :keypath="check.i18nKey">
          <template #parameters>
            <template
              v-for="(field, index) in check.fields"
              :key="field"
            >
              <button
                v-if="reveal"
                class="ff-entity-check-field"
                :data-testid="`ff-entity-check-field-${field}`"
                type="button"
                @click="revealField(field)"
              >
                {{ defaultLabelFormatter(field) }}
              </button>
              <template v-else>
                {{ defaultLabelFormatter(field) }}
              </template>
              <template v-if="index < check.fields.length - 1">
                {{ ', ' }}
              </template>
            </template>
          </template>
        </i18nT>
      </li>
    </ul>
  </KAlert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EntityCheck } from '../form-schema'
import useI18n from '../composables/useI18n'
import { defaultLabelFormatter, useOptionalFormShared } from '../composables'
import { toDataPath } from '../composables/reveal'
import * as utils from '../utils'

const { entityChecks, visibleFields, path = '' } = defineProps<{
  entityChecks?: EntityCheck[]
  visibleFields?: string[]
  /**
   * The path of the record the checks are declared on: their field names are
   * relative to it. Field names become links that reveal the field when the
   * alert is inside a `Form`.
   */
  path?: string
}>()

const { i18nT } = useI18n()

const form = useOptionalFormShared()
const reveal = form?.reveal

/**
 * Reveals a field the check names, resolved against the record's path
 */
function revealField(field: string) {
  if (!form) return
  const base = path ? utils.parseDataPath(toDataPath(path, form.keyIdMap.getKey)) : []
  form.reveal(utils.formatDataPath([...base, ...utils.toArray(field)]))
}

const CHECK_TYPES = [
  { key: 'at_least_one_of', i18nKey: 'field_rules.at_least_one_of' },
  { key: 'mutually_required', i18nKey: 'field_rules.mutually_required' },
  { key: 'mutually_exclusive', i18nKey: 'field_rules.mutually_exclusive' },
] as const

const checks = computed(() => {
  if (!Array.isArray(entityChecks) || entityChecks.length === 0) {
    return null
  }

  const checks: Array<{ key: string, i18nKey: typeof CHECK_TYPES[number]['i18nKey'], fields: string[] }> = []

  entityChecks.forEach((check, index) => {
    for (const { key, i18nKey } of CHECK_TYPES) {
      if (key in check) {
        const fields = check[key as keyof typeof check] as string[]
        if (Array.isArray(fields) && fields.length > 0) {
          const visibleCheckFields = getVisibleCheckFields(fields)
          if (visibleCheckFields.length > 0) {
            checks.push({ key: `${index}-${key}`, i18nKey, fields: visibleCheckFields })
          }
        }
        break
      }
    }
  })

  return checks.length ? checks : null
})

function getVisibleCheckFields(fields: string[]): string[] {
  if (!Array.isArray(visibleFields)) {
    return fields
  }
  return fields.filter(field => visibleFields.includes(field.split('.')[0]))
}
</script>

<style scoped lang="scss">
.ff-entity-checks-list {
  list-style: disc;
  margin: 0;
  padding-left: var(--kui-space-70, $kui-space-70);
}

// A link inside the alert's sentence, styled like `KAlert` styles its own
// links (it only reaches `a` elements): the alert's text color, underlined,
// and the stronger shade on hover
.ff-entity-check-field {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-decoration: underline;

  &:hover {
    color: var(--kui-alert-color-text-info-hover, var(--kui-color-text-info-strong, $kui-color-text-info-strong));
  }
}
</style>
