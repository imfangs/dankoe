import {onMounted, readonly, ref} from 'vue'
import articles from '../articles.json'
const key = 'dankoe:read:v1'
const known = new Set(articles.map(a => a.slug))
const readSlugs = ref([])
const ready = ref(false)
const storageError = ref(false)
let listening = false
function decode(raw) {
  const value = JSON.parse(raw || '[]')
  if (!Array.isArray(value)) throw new Error('Invalid reading state')
  return [...new Set(value.filter(slug => typeof slug === 'string' && known.has(slug)))]
}
function hydrate() {
  try { readSlugs.value = decode(localStorage.getItem(key)) }
  catch { storageError.value = true }
  ready.value = true
  if (!listening) {
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return
      try { readSlugs.value = decode(event.newValue) }
      catch { storageError.value = true }
    })
    listening = true
  }
}
function toggleRead(slug) {
  if (!ready.value || !known.has(slug)) return
  // Read the latest saved state before changing one item, including updates from another tab.
  let latest = readSlugs.value
  try { if (!storageError.value) latest = decode(localStorage.getItem(key)) } catch { storageError.value = true }
  readSlugs.value = latest.includes(slug) ? latest.filter(s => s !== slug) : [...latest, slug]
  try { localStorage.setItem(key, JSON.stringify(readSlugs.value)); storageError.value = false }
  catch { storageError.value = true }
}
export function useReadingState() {
  onMounted(() => { if (!ready.value) hydrate() })
  return {readSlugs: readonly(readSlugs), ready: readonly(ready), storageError: readonly(storageError), isRead: slug => readSlugs.value.includes(slug), toggleRead}
}
