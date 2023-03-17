<template>
  <input
    :checked="checked"
    type="checkbox"
  >
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue'

type TaskCheckboxProps = {
  checked: boolean;
};

const props = defineProps<TaskCheckboxProps>()

const checked = ref(props.checked)

</script>
