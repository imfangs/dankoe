<script setup>
import {computed} from 'vue'
import {useData} from 'vitepress'
import picks from '../reading-picks.json'
import ReadingAction from './ReadingAction.vue'
import {useReadingState} from '../composables/reading-state'
const {frontmatter}=useData()
const slug=computed(()=>frontmatter.value.originalUrl?.split('/').filter(Boolean).at(-1)||'')
const pick=computed(()=>picks.find(p=>p.slug===slug.value))
const {storageError}=useReadingState()
</script>
<template>
  <div class="article-meta">
    <p>{{frontmatter.originalTitle}}</p><div>Dan Koe · {{frontmatter.date}} · 约 {{frontmatter.minutes}} 分钟</div>
    <a :href="frontmatter.originalUrl" target="_blank" rel="noopener noreferrer">阅读英文原文 ↗</a><span class="translation-note">非官方 AI 辅助翻译 · 请以原文为准</span>
    <div class="article-reading-tools"><a v-if="pick" :href="'/picks#pick-'+slug">格得精选 · 看 brief</a><ReadingAction v-if="slug" :slug="slug" :title="frontmatter.title" /><span>进度仅存于当前浏览器</span></div>
    <p v-if="storageError" class="reading-storage-warning" role="status">当前浏览器无法保存进度，刷新后可能丢失。</p>
  </div>
</template>
