<template>
  <ul>
    <li>
      <router-link :to="{ name: 'list-plugin' }">
        PluginList
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'plugin-form-playground' }">
        PluginForm Playground
      </router-link>
    </li>
  </ul>
</template>
