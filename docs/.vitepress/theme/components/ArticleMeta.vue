<script setup>
import {useData} from 'vitepress'
const {frontmatter}=useData()
</script>
<template><div class="article-meta"><p>{{frontmatter.originalTitle}}</p><div>Dan Koe · {{frontmatter.date}} · 约 {{frontmatter.minutes}} 分钟</div><a :href="frontmatter.originalUrl" target="_blank" rel="noopener noreferrer">阅读英文原文 ↗</a><span class="translation-note">非官方 AI 辅助翻译 · 请以原文为准</span></div></template>
