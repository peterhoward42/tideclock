<script lang="ts">
  import { curiosityTunnelColorAt } from "../../diagram-config/homeStyleModel.preset";

  interface Props {
    readonly text: string;
  }

  let { text }: Props = $props();

  const chars = $derived(Array.from(text));
</script>

<span class="curiosity-tunnel-text">
  {#each chars as char, i (i)}
    <span class="curiosity-tunnel-text__glyph" style:color={curiosityTunnelColorAt(i)}
      >{char}</span
    >
  {/each}
</span>

<style>
  .curiosity-tunnel-text {
    display: inline;
  }

  .curiosity-tunnel-text__glyph {
    transition: filter 120ms ease-out;
  }
</style>
