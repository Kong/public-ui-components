<template>
  <ul>
    <li>
      <router-link :to="{ name: 'trace-viewer' }">
        TraceViewer
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'waterfall' }">
        Waterfall
      </router-link>
    </li>
  </ul>
</template>
