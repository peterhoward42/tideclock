<script>
  import { tideProfilePath } from '../../geometry/tideProfileGeometry.js'

  /**
   * @typedef {Object} TideLayerProps
   * @property {import('../../domain/tideExtremes.js').TideExtreme[]} [extremes]
   */
  /** @type {TideLayerProps} */
  let { extremes = [] } = $props()
  const profile = $derived(tideProfilePath(extremes))
</script>

<g class="tide-layer" aria-hidden="true">
  <path d={profile.d} fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
</g>
