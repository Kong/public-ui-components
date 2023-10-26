<template>
  <div>
    <!--  <KCollapse
      v-model="shouldCollapsedCustomPlugins"
      class="plugins-collapse"
      :data-testid="`${PLUGIN_GROUPS.CUSTOM_PLUGINS}-collapse`"
      :trigger-label="shouldCollapsedCustomPlugins ? triggerLabels[PLUGIN_GROUPS.CUSTOM_PLUGINS] : pluginHelpText.viewLess"
    >
      <template
        v-if="filteredCustomPlugins.length <= PLUGINS_PER_ROW"
        #trigger
      >
            &nbsp;
      </template>
      <template #visible-content>
        <div class="plugin-card-container">
          <component
            :is="componentType(plugin)"
            v-for="(plugin, index) in getPluginCards(filteredCustomPlugins, 'visible')"
            :key="index"
            class="plugin-card"
            :class="{
              'disabled': !plugin.available || plugin.disabledMessage,
              'plugin-card-cursor-pointer': isCreateCustomPlugin(plugin) || componentType(plugin) === 'div' && noRouteChange
            }"
            :label="plugin.disabledMessage"
            :position-fixed="plugin.disabledMessage ? true : undefined"
            :title="!plugin.available ? 'This plugin is not available' : plugin.name"
            :to="componentType(plugin) === 'router-link' ? getOnClickRoute(plugin) : undefined"
          >
            <template #content>
              <div style="max-width: 345px;">
                {{ plugin.disabledMessage }}
              </div>
            </template>
            <PluginCard
              :no-route-change="noRouteChange"
              :plugin="plugin"
              :runtime-group-id="runtimeGroupId"
              @click="props.noRouteChange ? emitPluginData(plugin) : undefined"
              @custom-plugin-clicked="handleCustomPluginClick(plugin)"
              @custom-plugin-delete="handleCustomPluginDelete(plugin)"
            />
          </component>
        </div>
      </template>

      <div class="plugin-card-container">
        <component
          :is="componentType(plugin)"
          v-for="(plugin, index) in getPluginCards(filteredCustomPlugins, 'hidden')"
          :key="index"
          class="plugin-card"
          :class="{
            'disabled': !plugin.available || plugin.disabledMessage,
            'plugin-card-cursor-pointer': isCreateCustomPlugin(plugin) || componentType(plugin) === 'div' && noRouteChange
          }"
          :label="plugin.disabledMessage"
          :position-fixed="plugin.disabledMessage ? true : undefined"
          :title="!plugin.available ? 'This plugin is not available' : plugin.name"
          :to="componentType(plugin) === 'router-link' ? getOnClickRoute(plugin) : undefined"
        >
          <template #content>
            <div style="max-width: 345px;">
              {{ plugin.disabledMessage }}
            </div>
          </template>
          <PluginCard
            :plugin="plugin"
            :runtime-group-id="runtimeGroupId"
            @click="props.noRouteChange ? emitPluginData(plugin) : undefined"
            @custom-plugin-clicked="handleCustomPluginClick(plugin)"
            @custom-plugin-delete="handleCustomPluginDelete(plugin)"
          />
        </component>
      </div>
    </KCollapse>

    <DeleteCustomPluginSchemaModal
      v-if="openDeleteModal"
      :plugin="selectedPlugin"
      @closed="handleClose"
      @proceed="handleCustomPluginDeleted"
    /> -->
  </div>
</template>

<script setup lang="ts">
/* import { ref } from 'vue'
import DeleteCustomPluginSchemaModal from './DeleteCustomPluginSchemaModal.vue'

const shouldCollapsedCustomPlugins = ref(true) */
</script>

<style lang="scss" scoped>
/**
 // TODO:
 */
</style>
