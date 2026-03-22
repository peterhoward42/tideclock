<script>
  import { nowMs } from '../../application/appClock.js'

  /** @param {number} ms */
  function formatTime(ms) {
    return new Date(ms).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
</script>

<div class="tide-clock">
  <p class="muted">Local time</p>
  <p style="font-family: ui-monospace, monospace; margin: 0; font-size: 1.25rem;">
    {formatTime($nowMs)}
  </p>
</div>
