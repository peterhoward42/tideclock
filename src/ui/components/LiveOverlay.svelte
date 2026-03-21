<script>
  import { nowMs } from '../../application/appClock.js'

  const frame = { cx: 100, cy: 100, r: 72 }

  /**
   * @param {number} t
   */
  function handLine(t) {
    const d = new Date(t)
    const minutes = d.getHours() * 60 + d.getMinutes()
    const angle = (minutes / (12 * 60)) * 2 * Math.PI - Math.PI / 2
    const x2 = frame.cx + frame.r * Math.cos(angle)
    const y2 = frame.cy + frame.r * Math.sin(angle)
    return { x1: frame.cx, y1: frame.cy, x2, y2 }
  }

  /**
   * @param {number} t
   */
  function formatClock(t) {
    return new Date(t).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
</script>

<g class="live-overlay">
  {#if $nowMs != null}
    {@const line = handLine($nowMs)}
    <line
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <text x={frame.cx} y={frame.cy + frame.r + 22} text-anchor="middle" class="clock-readout" font-size="11">
      {formatClock($nowMs)}
    </text>
  {/if}
</g>
