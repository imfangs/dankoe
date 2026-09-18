<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import articles from '../articles.json'
import picks from '../reading-picks.json'
import PickBrief from './PickBrief.vue'
import ReadingAction from './ReadingAction.vue'
import {useReadingState} from '../composables/reading-state'
const props=defineProps({limit:Number,curated:Boolean})
const query=ref(''),year=ref('全部年份'),topic=ref('全部主题'),page=ref(1)
const onlyPicks=ref(props.curated),readFilter=ref('all'),maxMinutes=ref(0)
const {readSlugs,isRead,storageError}=useReadingState()
const pickMap=new Map(picks.map(p=>[p.slug,p]))
const years=['全部年份',...new Set(articles.map(a=>a.date.slice(0,4)))]
const topics=['全部主题',...new Set(articles.map(a=>a.topic))]
const selected=computed(()=>props.curated||onlyPicks.value)
const readCount=computed(()=>picks.filter(p=>readSlugs.value.includes(p.slug)).length)
const matches=computed(()=>{
  const q=query.value.trim().toLowerCase()
  const result=articles.filter(a=>{
    const pick=pickMap.get(a.slug)
    return (!selected.value||pick)&&(year.value==='全部年份'||a.date.startsWith(year.value))&&
      (topic.value==='全部主题'||a.topic===topic.value)&&(!maxMinutes.value||a.minutes<=maxMinutes.value)&&
      (readFilter.value==='all'||(readFilter.value==='read'?isRead(a.slug):!isRead(a.slug)))&&
      [a.title,a.titleEn,a.excerpt,pick?.why,pick?.focus,...(pick?.points||[])].join(' ').toLowerCase().includes(q)
  })
  return selected.value?result.sort((a,b)=>pickMap.get(a.slug).rank-pickMap.get(b.slug).rank):result
})
const shown=computed(()=>matches.value.slice(0,props.limit||page.value*24))
watch([query,year,topic,onlyPicks,readFilter,maxMinutes],()=>{page.value=1})
onMounted(()=>{
  if (!props.curated&&!props.limit) onlyPicks.value=new URLSearchParams(location.search).get('picks')==='1'
})
watch(onlyPicks,value=>{
  if(props.curated||props.limit||typeof window==='undefined')return
  const url=new URL(location.href)
  if(value)url.searchParams.set('picks','1');else url.searchParams.delete('picks')
  history.replaceState(history.state,'',url)
})
function resetFilters(){query.value='';year.value='全部年份';topic.value='全部主题';readFilter.value='all';maxMinutes.value=0;onlyPicks.value=props.curated}
</script>
<template>
  <section class="library" :aria-label="curated?'格得精选文章':'文章列表'">
    <div v-if="!limit" class="library-controls">
      <input v-model="query" type="search" placeholder="搜索标题或关键词…" aria-label="筛选文章" />
      <template v-if="!curated">
        <select v-model="topic" aria-label="按主题筛选"><option v-for="t in topics" :key="t">{{t}}</option></select>
        <select v-model="year" aria-label="按年份筛选"><option v-for="y in years" :key="y">{{y}}</option></select>
      </template>
    </div>
    <div v-if="!limit" class="reading-filters">
      <label v-if="!curated" class="picks-toggle"><input v-model="onlyPicks" type="checkbox" />只看格得精选</label>
      <select v-model.number="maxMinutes" aria-label="按全文阅读时长筛选">
        <option :value="0">不限时长</option><option :value="5">5 分钟以内</option><option :value="10">10 分钟以内</option><option :value="20">20 分钟以内</option>
      </select>
      <select v-model="readFilter" aria-label="按阅读状态筛选"><option value="all">全部进度</option><option value="unread">未读</option><option value="read">已读</option></select>
    </div>
    <div v-if="!limit" class="library-status" aria-live="polite">
      <span>{{matches.length}} 篇{{selected?'精选':''}}文章</span>
      <span v-if="selected">精选已读 {{readCount}} / {{picks.length}} · 按推荐顺序</span>
    </div>
    <p v-if="!limit" class="reading-storage-note">时长按全文估算；已读进度只保存在当前浏览器，不跨设备同步。</p>
    <p v-if="storageError" role="status" class="reading-storage-warning">当前浏览器无法保存进度，刷新后可能丢失；本次仍可标记。</p>
    <div class="article-rows">
      <article v-for="a in shown" :key="a.slug" :id="curated?'pick-'+a.slug:undefined" class="article-row" :class="{'has-been-read':isRead(a.slug)}">
        <div class="article-date">
          <template v-if="selected"><span class="pick-rank">{{String(pickMap.get(a.slug).rank).padStart(2,'0')}}<span v-if="pickMap.get(a.slug).rank<=3"> · 先读</span></span><span>{{pickMap.get(a.slug).focus}}</span></template>
          <template v-else><time :datetime="a.date">{{a.date}}</time><span>{{a.topic}}</span></template>
        </div>
        <div class="article-summary">
          <h2><a :href="a.url">{{a.title}}</a></h2>
          <p class="english-title">{{a.titleEn}}</p>
          <p v-if="selected" class="pick-reason">{{pickMap.get(a.slug).why}}</p>
          <p v-else class="excerpt">{{a.excerpt}}</p>
          <span class="reading-time">全文约 {{a.minutes}} 分钟</span>
          <a v-if="!selected&&pickMap.has(a.slug)" class="pick-link" :href="'/picks#pick-'+a.slug">格得精选 · 看 brief</a>
          <PickBrief v-if="selected" :pick="pickMap.get(a.slug)" />
          <div v-if="!limit" class="article-actions"><a :href="a.url">阅读全文 →</a><ReadingAction :slug="a.slug" :title="a.title" /></div>
        </div>
      </article>
    </div>
    <div v-if="!matches.length" class="empty-state"><p>没有匹配的文章。可以调整时间、阅读状态或关键词。</p><button class="reset-filters" @click="resetFilters">清除筛选</button></div>
    <button v-if="!limit&&shown.length<matches.length" class="load-more" @click="page++">继续浏览（还有 {{matches.length-shown.length}} 篇）</button>
  </section>
</template>
