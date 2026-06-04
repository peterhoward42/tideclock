// @ts-check
/**
 * main.js — Vite browser entry: mounts `App` on `#app`, logs boot diagnostics.
 * Downstream: Svelte UI only. Owns nothing domain-specific.
 * Kind: Adapter / boundary (runtime entry). Does not implement routing or tide loading.
 */
import { mount } from 'svelte'
import './app.css'
import App from './ui/App.svelte'
import { injectProductAnalytics } from './infrastructure/analytics/trackProductEvent'

injectProductAnalytics()

console.log('[tideclock] boot: main.js running (bundle loaded)')
if (import.meta.env.DEV) {
  const base = import.meta.env.VITE_TIDE_PROXY_BASE_URL
  console.log(
    '[tideclock] boot: VITE_TIDE_PROXY_BASE_URL',
    typeof base === 'string' && base.trim() !== '' ? base : '(missing or empty)'
  )
} else {
  console.log(
    '[tideclock] boot: VITE_TIDE_PROXY_BASE_URL configured:',
    Boolean(import.meta.env.VITE_TIDE_PROXY_BASE_URL)
  )
}

const target = document.getElementById('app')
if (!(target instanceof HTMLElement)) {
  throw new Error('Missing mount element #app')
}

const app = mount(App, { target })
console.log('[tideclock] boot: mount(App) completed')

export default app
