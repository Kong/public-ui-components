<template>
  <ul>
    <li>
      <router-link :to="{ name: 'list-plugin' }">
        PluginList
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'vault-secret-picker' }">
        VaultSecretPicker
      </router-link>
    </li>
  </ul>
</template>
