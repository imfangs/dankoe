<script setup>
import {useReadingState} from '../composables/reading-state'
defineProps({slug:{type:String,required:true},title:{type:String,required:true}})
const {isRead, toggleRead, ready} = useReadingState()
</script>
<template>
  <button class="reading-action" :class="{completed:isRead(slug)}" :disabled="!ready" :aria-pressed="isRead(slug)" :aria-label="(isRead(slug)?'标为未读：':'标为已读：')+title" @click="toggleRead(slug)">{{isRead(slug)?'已读 · 可撤销':'标为已读'}}</button>
</template>
