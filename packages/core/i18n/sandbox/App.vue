<template>
  <div class="sandbox-container">
    <main>
      <p>{{ i18n.t('global.ok') }}</p>

      <i18n-t
        keypath="global.named"
        tag="h1"
      >
        <template #greeting>
          <b>Morning</b>
        </template>

        <template #name>
          <i>Val</i>
        </template>

        <template #occupation>
          <i>Money Asker</i>
        </template>

        <template #amount>
          <div class="red">
            {{ i18n.formatNumber(1000, { style: 'currency', currency: 'USD' }) }}
          </div>
        </template>
      </i18n-t>

      <p>
        This is direct use of i18n-t (no plugin registration ):
      </p>
      <i18n-no-plugin
        keypath="global.default"
      >
        <b>
          <a href="https://google.com">Google</a>
        </b>
      </i18n-no-plugin>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n, createI18n, i18nTComponent } from '../src'
import english from './locales/en.json'

// this is grabbing i18n from global
const i18n = useI18n<typeof english>()

// this creates local i18n and component
const i18nLocal = createI18n('en-us', english)
const i18nNoPlugin = i18nTComponent<typeof english>(i18nLocal)
</script>
