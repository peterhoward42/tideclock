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
import { initProxyUserIdAtBoot } from './infrastructure/proxyUserId'

injectProductAnalytics()

console.log('[tideclock] boot: main.js running (bundle loaded)')
if (import.meta.env.DEV) {
  const base = import.meta.env.VITE_TIDE_PROXY_BASE_URL
  console.log(
    '[tideclock] boot: VITE_TIDE_PROXY_BASE_URL',
    typeof base === 'string' && base.trim() !== '' ? base : '(missing or empty)'
  )
  const telemetryBase = import.meta.env.VITE_TELEMETRY_BASE_URL
  console.log(
    '[tideclock] boot: VITE_TELEMETRY_BASE_URL',
    typeof telemetryBase === 'string' && telemetryBase.trim() !== ''
      ? telemetryBase
      : '(missing or empty)'
  )
} else {
  console.log(
    '[tideclock] boot: VITE_TIDE_PROXY_BASE_URL configured:',
    Boolean(import.meta.env.VITE_TIDE_PROXY_BASE_URL)
  )
  console.log(
    '[tideclock] boot: VITE_TELEMETRY_BASE_URL configured:',
    Boolean(import.meta.env.VITE_TELEMETRY_BASE_URL)
  )
}

if (typeof localStorage !== 'undefined') {
  const proxyUserId = initProxyUserIdAtBoot({
    loader: localStorage,
    storer: localStorage
  })
  if (import.meta.env.DEV && proxyUserId !== undefined) {
    console.log('[tideclock] boot: proxy user id ready')
  }
}

const target = document.getElementById('app')
if (!(target instanceof HTMLElement)) {
  throw new Error('Missing mount element #app')
}

const app = mount(App, { target })
console.log('[tideclock] boot: mount(App) completed')

export default app
