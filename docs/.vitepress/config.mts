import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import cjkFriendly from 'markdown-it-cjk-friendly'
const sidebar = JSON.parse(fs.readFileSync(new URL('./sidebar.json', import.meta.url),'utf8'))
export default defineConfig({
  lang: 'zh-CN', title: 'Dan Koe · 中文', description: 'Dan Koe 公开文章的非官方中文译站，关于心智、自主生活与一人企业。',
  srcExclude: ['**/README.md'], cleanUrls: true, appearance: true,
  head: [['meta',{name:'robots',content:'noindex, nofollow'}],['meta',{name:'theme-color',content:'#fafaf7'}]],
  markdown: { config(md) { md.use(cjkFriendly) } },
  themeConfig: {
    skipToContentLabel: '跳转到正文', darkModeSwitchTitle: '切换至深色主题', lightModeSwitchTitle: '切换至浅色主题',
    nav: [{text:'首页',link:'/'},{text:'格得精选',link:'/picks'},{text:'全部文章',link:'/letters/'},{text:'关于本站',link:'/about'}],
    sidebar: {'/letters/':sidebar,'/blog/':sidebar},
    search: {provider:'local',options:{translations:{button:{buttonText:'搜索文章',buttonAriaLabel:'搜索文章'},modal:{noResultsText:'没有找到结果',resetButtonTitle:'清除',footer:{selectText:'选择',navigateText:'切换',closeText:'关闭'}}}}},
    outline: {label:'本页目录',level:[2,3]},docFooter:{prev:'上一篇',next:'下一篇'},darkModeSwitchLabel:'切换明暗主题',sidebarMenuLabel:'文章目录',returnToTopLabel:'返回顶部',
    footer:{message:'非官方中文译站 · 译文仅供个人学习，版权归 Dan Koe 及原权利人所有',copyright:'原文：thedankoe.com · 中文整理：方帅'}
  }
})
