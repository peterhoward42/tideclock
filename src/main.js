// @ts-check
// Entry: mounts the Svelte app on `#app` (throws if missing); logs boot diagnostics to the console.
import { mount } from 'svelte'
import './app.css'
import App from './ui/App.svelte'

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
