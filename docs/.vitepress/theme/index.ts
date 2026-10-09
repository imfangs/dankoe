import HomeEditorial from './components/HomeEditorial.vue'
import DefaultTheme from 'vitepress/theme'
import ArticleList from './components/ArticleList.vue'
import ArticleMeta from './components/ArticleMeta.vue'
import './style.css'
export default {extends:DefaultTheme,enhanceApp({app}) {app.component('HomeEditorial',HomeEditorial);app.component('ArticleList',ArticleList);app.component('ArticleMeta',ArticleMeta)}}
