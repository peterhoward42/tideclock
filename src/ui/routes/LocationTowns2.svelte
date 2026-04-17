<script lang="ts">
  /**
   * LocationTowns2.svelte — Coastal place search using fragment AND matching ({@link SearchSpaceQueryer})
   * over the baked towns2 list. Calls the shell to persist selection.
   */
  import { navigate } from "../../infrastructure/router.js";
  import type { Town } from "../../data/townSchema";
  import {
    towns2SearchSpaceQueryer,
    towns2ByTownId
  } from "../../data/bakedTowns2";

  interface Props {
    readonly setCurrentLocation: (town: Town) => void;
  }

  /** Shown rows; match counting uses MATCH_COUNT_CEILING. */
  const MAX_VISIBLE_RESULTS = 6;
  /** Stop counting matches here so we can say “more than {MATCH_COUNT_CEILING - 1}”. */
  const MATCH_COUNT_CEILING = 51;

  let { setCurrentLocation }: Props = $props();
  let searchText = $state("");

  const trimmedQuery = $derived(searchText.trim());

  const queryPack = $derived.by(() => {
    if (trimmedQuery === "") {
      return { kind: "idle" as const };
    }
    return {
      kind: "run" as const,
      ...towns2SearchSpaceQueryer.queryWithResultCapAndMatchCeiling(
        trimmedQuery,
        MAX_VISIBLE_RESULTS,
        MATCH_COUNT_CEILING
      )
    };
  });

  function chooseByKey(townId: string): void {
    const town = towns2ByTownId.get(townId);
    if (town === undefined) {
      return;
    }
    if (import.meta.env.DEV && import.meta.env.MODE !== "test") {
      console.log("[tideclock] location-towns2:", "chooseByKey", {
        townId: town.id,
        townName: town.name
      });
    }
    setCurrentLocation(town);
    navigate("home");
  }
</script>

<main class="route">
  <p class="example-lead">
    <span class="mono">park chesh</span>
    <span class="example-lead__arrow">→</span>
    Parkgate, Cheshire
  </p>

  <details class="how">
    <summary class="how__summary">How this works</summary>
    <p class="how__body">
      Short <strong>pieces</strong>, spaces between — each must appear somewhere in the name. Order
      does not matter; they need not be full spellings or prefixes.
    </p>
  </details>

  <label class="search-label" for="town2-search">Search places</label>
  <input
    id="town2-search"
    type="search"
    bind:value={searchText}
    class="search-input"
    placeholder="e.g. park chesh"
    spellcheck="false"
    autocomplete="off"
    enterkeyhint="search"
  />

  <section class="feedback">
    {#if queryPack.kind === "idle"}
      <p class="feedback-line muted">Start typing.</p>
    {:else if queryPack.totalMatchingRows === 0}
      <p class="feedback-line muted">No matches — try other pieces or fewer.</p>
    {:else}
      {#if queryPack.totalHitCountCeiling}
        <p class="feedback-line">
          {MATCH_COUNT_CEILING - 1}+ matches — add another piece.
          <span class="muted"> First {MAX_VISIBLE_RESULTS} listed.</span>
        </p>
      {:else if queryPack.totalMatchingRows > MAX_VISIBLE_RESULTS}
        <p class="feedback-line">
          {queryPack.totalMatchingRows} matches — first {MAX_VISIBLE_RESULTS} shown. Add a piece to
          narrow.
        </p>
      {:else if queryPack.totalMatchingRows > 1}
        <p class="feedback-line muted">{queryPack.totalMatchingRows} matches — pick one.</p>
      {/if}

      <ul class="results">
        {#each queryPack.resultKeys as townId, i (townId)}
          <li class="results__item">
            <button type="button" class="place-button" onclick={() => chooseByKey(townId)}>
              {queryPack.displayNames[i]}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  .route {
    display: grid;
    gap: 0.6rem;
    max-width: 34rem;
  }

  .example-lead {
    margin: 0;
    font-size: 0.95rem;
    color: #374151;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.5rem;
  }

  .example-lead__arrow {
    color: #9ca3af;
    user-select: none;
  }

  .how {
    margin: 0;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.35rem 0.6rem;
    background: #fafafa;
  }

  .how__summary {
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: #4b5563;
    list-style: none;
  }

  .how__summary::-webkit-details-marker {
    display: none;
  }

  .how__body {
    margin: 0.5rem 0 0.15rem;
    font-size: 0.82rem;
    line-height: 1.35;
    color: #4b5563;
  }

  .muted {
    color: #6b7280;
    font-weight: 400;
  }

  .mono {
    font-family: ui-monospace, monospace;
    font-size: 0.92em;
  }

  .search-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search-input {
    width: 100%;
    max-width: 100%;
    padding: 0.65rem 0.8rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font: inherit;
  }

  .feedback {
    display: grid;
    gap: 0.4rem;
  }

  .feedback-line {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: #111827;
  }

  .results {
    list-style: none;
    margin: 0.15rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }

  .place-button {
    display: block;
    width: 100%;
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    color: #1d4ed8;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;
    text-align: left;
  }
</style>
