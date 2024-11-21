<template>
  <ul>
    <li>
      <router-link :to="{ name: 'vault-list' }">
        VaultList
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'vault-secret-picker' }">
        VaultSecretPicker
      </router-link>
    </li>
  </ul>
</template>
