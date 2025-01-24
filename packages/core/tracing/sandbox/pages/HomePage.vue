<template>
  <ul>
    <li>
      <router-link :to="{ name: 'trace' }">
        Trace View (Complete)
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'lifecycle' }">
        Lifecycle View
      </router-link>
    </li>
    <li>
      <router-link :to="{ name: 'waterfall' }">
        Waterfall View
      </router-link>
    </li>
  </ul>
</template>
