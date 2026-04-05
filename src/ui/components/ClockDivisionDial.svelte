<script lang="ts">
  /**
   * ClockDivisionDial.svelte — SVG hour ring and ticks from `clockPathMapping` + `ClockSceneModel`.
   * Kind: Presentation. Does not handle tide labels or network state.
   */
  import { STANDARD_DIVISION_TICK_LENGTH } from "../../clock-presentation/clockDivisionGeometry";
  import type { ClockSceneModel } from "../../clock-presentation/clockSceneModel";
  import { clockDivisionDialSvgProps } from "../svg/clockPathMapping";

  interface Props {
    readonly clockScene: ClockSceneModel;
  }

  let { clockScene }: Props = $props();

  const dial = $derived(
    clockDivisionDialSvgProps(clockScene, STANDARD_DIVISION_TICK_LENGTH),
  );
</script>

<svg
  class="clock-division-dial"
  aria-hidden="true"
  focusable="false"
  viewBox={dial.viewBox}
>
  <circle
    cx={dial.outline.cx}
    cy={dial.outline.cy}
    r={dial.outline.r}
    fill="none"
    stroke="currentColor"
    stroke-width="1"
  />
  {#each dial.ticks as t, i (i)}
    <line
      x1={t.x1}
      y1={t.y1}
      x2={t.x2}
      y2={t.y2}
      stroke="currentColor"
      stroke-width="0.75"
    />
  {/each}
</svg>
