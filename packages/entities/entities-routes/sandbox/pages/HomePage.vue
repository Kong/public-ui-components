<template>
  <ul>
    <li>
      <router-link :to="{ name: 'route-list' }">
        RouteList
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'route-rules-composer' }">
        RouteRulesComposer
      </router-link>
    </li>
  </ul>
</template>
