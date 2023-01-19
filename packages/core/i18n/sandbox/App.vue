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
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../src'
const i18n = useI18n()
</script>
