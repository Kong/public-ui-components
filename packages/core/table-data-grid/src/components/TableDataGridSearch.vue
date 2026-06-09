<template>
  <div class="datatable-search">
    <KInput
      v-model.trim="search"
      autocomplete="off"
      class="datatable-search-input"
      data-testid="table-data-grid-search"
      :placeholder="i18n.t('datatable.searchPlaceholder')"
      type="search"
    >
      <template #before>
        <SearchIcon decorative />
      </template>

      <template
        v-if="search"
        #after
      >
        <KButton
          appearance="tertiary"
          :aria-label="i18n.t('datatable.clearSearch')"
          class="clear-search"
          data-testid="table-data-grid-search-clear"
          icon
          size="small"
          @click.stop="search = ''"
        >
          <CloseIcon decorative />
        </KButton>
      </template>
    </KInput>
  </div>
</template>

<script setup lang="ts">
import { CloseIcon, SearchIcon } from '@kong/icons'
import composables from '../composables'

const search = defineModel<string>({ required: true })

const { i18n } = composables.useI18n()
</script>

<style lang="scss" scoped>
.datatable-search {
  align-items: center;
  display: flex;
  min-width: 0;
}

:deep(.k-input).datatable-search-input {
  max-width: 100%;
  min-width: 220px;
  width: 260px;

  ::-webkit-search-cancel-button {
    /* hide the default "X" button */
    -webkit-appearance: none;
  }
}

.clear-search {
  flex-shrink: 0;
}
</style>
