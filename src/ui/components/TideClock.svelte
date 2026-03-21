<script>
  import { onMount } from 'svelte'
  import { loadTideExtremes } from '../../application/tideService.js'
  import StaticFrame from './StaticFrame.svelte'
  import TideLayer from './TideLayer.svelte'
  import LiveOverlay from './LiveOverlay.svelte'

  /** @type {import('../../domain/tideExtremes.js').TideExtreme[]} */
  let extremes = $state([])

  onMount(() => {
    void loadTideExtremes(Date.now()).then((v) => {
      extremes = v
    })
  })
</script>

<div class="tide-clock">
  <svg viewBox="0 0 200 200" role="img" aria-label="Tide clock (placeholder)">
    <StaticFrame />
    <TideLayer {extremes} />
    <LiveOverlay />
  </svg>
</div>
