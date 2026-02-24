<script lang="ts" setup>
import { useTimestamp } from "@vueuse/core"
import { computed } from "vue"

const props = defineProps({
  start: {
    type: Number,
    required: true,
    default: 0,
  },
  end: {
    type: Number,
    required: true,
    default: 0,
  },
})

// Use a reference to generate reactive time.
const timestamp = useTimestamp()

const formatMinutesSeconds = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return [minutes, seconds].map((time) => `0${time}`.slice(-2)).join(":")
}

// Computed methods
const getTimeElapsed = computed(() => {
  const timeElapsed = timestamp.value - props.start
  return formatMinutesSeconds(timeElapsed)
})

const getTimeLeft = computed(() => {
  const totalDuration = props.end - props.start
  return formatMinutesSeconds(totalDuration)
})

const getStyles = computed(() => {
  const total = props.end - props.start
  const progress = 100 - (100 * (props.end - timestamp.value)) / total

  const clampedProgress = Math.max(0, Math.min(100, progress))
  return {
    width: `${clampedProgress.toFixed(2)}%`,
  }
})
</script>

<template>
  <div class="rounded-lg bg-gray-200/20 h-2">
    <div class="rounded-lg bg-white/75 h-2 transition-all" :style="getStyles" />
  </div>

  <div class="flex mt-2 text-sm opacity-60 items-center justify-between">
    <span>{{ getTimeElapsed }}</span>
    <span>{{ getTimeLeft }}</span>
  </div>
</template>
