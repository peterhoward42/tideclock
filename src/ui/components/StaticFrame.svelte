<script>
  import { buildDialFrame } from '../../geometry/dialGeometry.js'

  const frame = buildDialFrame(100, 100, 90)
</script>

<g class="static-frame" aria-hidden="true">
  <circle cx={frame.cx} cy={frame.cy} r={frame.outerR} fill="none" stroke="currentColor" stroke-width="2" />
  <circle cx={frame.cx} cy={frame.cy} r={frame.innerR} fill="none" stroke="currentColor" stroke-width="1" opacity="0.35" />
</g>
