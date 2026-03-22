// @ts-check
// Entry: mounts the Svelte app on `#app` (throws if that element is missing).
import { mount } from 'svelte'
import './app.css'
import App from './ui/App.svelte'

console.log('[tideclock] boot: main.js running (bundle loaded)')

const target = document.getElementById('app')
if (!(target instanceof HTMLElement)) {
  throw new Error('Missing mount element #app')
}

const app = mount(App, { target })
console.log('[tideclock] boot: mount(App) completed')

export default app
