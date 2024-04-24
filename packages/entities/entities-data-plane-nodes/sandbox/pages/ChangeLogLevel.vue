<template>
  <h2>Change Log Level Modal</h2>
  <KButton @click="visible = true">
    Open
  </KButton>
  <ChangeLogLevelModal
    v-model:visible="visible"
    :instance-list="instanceList"
    :instance-log-level="instanceLogLevel"
    :requests="{ getDataPlaneLogLevel, setDataPlaneLogLevel, scheduler: { maxConcurrentAsyncs: 3 }}"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChangeLogLevelModal, LogLevel, type DataPlaneNodeCommon } from '../../src'

const visible = ref<boolean>(false)

const instanceList = ref<(Pick<DataPlaneNodeCommon, 'id' | 'hostname'>& { hasDLLCapability?: boolean })[]>([
  { id: '1', hostname: 'localhost-1' },
  { id: '2', hostname: 'localhost-2' },
  { id: '3', hostname: 'localhost-3' },
  { id: '4', hostname: 'localhost-4', hasDLLCapability: false },
  { id: '5', hostname: 'localhost-5' },
])

const instanceLogLevel = ref<Map<string, LogLevel>>(new Map([
  ['1', LogLevel.Debug],
  ['2', LogLevel.Info],
  ['3', LogLevel.Notice],
  ['4', LogLevel.Warn],
  ['5', LogLevel.Error],
]))

const getDataPlaneLogLevel = async (instanceId: string): Promise<LogLevel> => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
  return instanceLogLevel.value.get(instanceId) ?? LogLevel.Notice
}

const setDataPlaneLogLevel = async (instanceId: string, logLevel: LogLevel, revertAfter: number): Promise<void> => {
  console.log(`Setting log level of ${instanceId} to ${logLevel} and revert after ${revertAfter} seconds...`)
  if (Math.random() < 0.3) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500))
    throw new Error('Failed to set log level')
  }
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1500))
}
</script>

<style lang="scss" scoped>
</style>
