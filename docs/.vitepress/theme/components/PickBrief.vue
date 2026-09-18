<script setup>
defineProps({pick:{type:Object,required:true}})
</script>
<template>
  <details class="pick-brief">
    <summary>1 分钟 brief</summary>
    <div class="brief-content">
      <p class="brief-label">原文的三个要点</p>
      <ul><li v-for="point in pick.points" :key="point">{{point}}</li></ul>
      <p class="brief-label">带着这个问题读</p>
      <p>{{pick.question}}</p>
      <p class="brief-label">格得的提醒</p>
      <p class="brief-caveat">{{pick.caveat}}</p>
    </div>
  </details>
</template>
