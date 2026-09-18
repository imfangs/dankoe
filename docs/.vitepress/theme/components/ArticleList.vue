<script setup>
import {computed,ref} from 'vue'
import articles from '../articles.json'
const props=defineProps({limit:Number})
const query=ref(''),year=ref('全部年份'),topic=ref('全部主题'),page=ref(1)
const years=['全部年份',...new Set(articles.map(a=>a.date.slice(0,4)))]
const topics=['全部主题',...new Set(articles.map(a=>a.topic))]
const matches=computed(()=>articles.filter(a=>(year.value==='全部年份'||a.date.startsWith(year.value))&&(topic.value==='全部主题'||a.topic===topic.value)&&(`${a.title} ${a.titleEn} ${a.excerpt}`.toLowerCase().includes(query.value.trim().toLowerCase()))))
const shown=computed(()=>matches.value.slice(0,props.limit||page.value*24))
</script>
<template>
  <section class="library" aria-label="文章列表">
    <div v-if="!limit" class="library-controls">
      <input v-model="query" @input="page=1" type="search" placeholder="搜索标题或关键词…" aria-label="筛选文章" />
      <select v-model="topic" @change="page=1" aria-label="按主题筛选"><option v-for="t in topics" :key="t">{{t}}</option></select>
      <select v-model="year" @change="page=1" aria-label="按年份筛选"><option v-for="y in years" :key="y">{{y}}</option></select>
    </div>
    <p v-if="!limit" class="result-count" aria-live="polite">{{matches.length}} 篇文章</p>
    <div class="article-rows">
      <article v-for="a in shown" :key="a.slug" class="article-row">
        <div class="article-date"><time :datetime="a.date">{{a.date}}</time><span>{{a.topic}}</span></div>
        <div class="article-summary"><h2><a :href="a.url">{{a.title}}</a></h2><p class="english-title">{{a.titleEn}}</p><p class="excerpt">{{a.excerpt}}</p><span class="reading-time">约 {{a.minutes}} 分钟</span></div>
      </article>
    </div>
    <p v-if="!matches.length" class="empty-state">没有找到匹配的文章。试试其他关键词，或切换主题和年份。</p>
    <button v-if="!limit&&shown.length<matches.length" class="load-more" @click="page++">继续浏览（还有 {{matches.length-shown.length}} 篇）</button>
  </section>
</template>
