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
  import {
    buildTownPickerVisiblePresentation,
    buildVisibleTownRowsFromKeys,
    sortTownPickerExhaustiveResultKeys
  } from "../../location-services/townPickerDisambiguation";

  interface Props {
    readonly setCurrentLocation: (town: Town) => void;
  }

  /** Cap on listed rows; the profiled query still reports exact total matches. */
  const MAX_VISIBLE_RESULTS = 6;

  let { setCurrentLocation }: Props = $props();
  let searchText = $state("");

  const trimmedQuery = $derived(searchText.trim());

  const queryPack = $derived.by(() => {
    if (trimmedQuery === "") {
      return { kind: "idle" as const };
    }
    return {
      kind: "run" as const,
      ...towns2SearchSpaceQueryer.queryProfiled(
        trimmedQuery,
        MAX_VISIBLE_RESULTS
      )
    };
  });

  /** Raw keys from the queryer (scan order); reordered only for exhaustive shortlists. */
  const pickerResultKeys = $derived.by(() => {
    if (queryPack.kind !== "run") {
      return [] as string[];
    }
    const keys = queryPack.rows.resultKeys;
    if (queryPack.rows.overflowCount !== 0) {
      return [...keys];
    }
    return sortTownPickerExhaustiveResultKeys(keys, towns2ByTownId);
  });

  const visibleRowLabels = $derived.by(() => {
    if (queryPack.kind !== "run") {
      return [] as string[];
    }
    const visibleRows = buildVisibleTownRowsFromKeys(
      pickerResultKeys,
      towns2ByTownId
    );
    return buildTownPickerVisiblePresentation(visibleRows).labels;
  });

  /** Selectable only when the visible list is the full match set (see planning/location-search-problem-space.md). */
  const resultsAreSelectable = $derived(
    queryPack.kind === "run" && queryPack.rows.overflowCount === 0
  );

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
  <p class="search-prompt">
    Start typing short parts of the place name, with spaces between
  </p>

  <label class="search-label" for="town2-search">Search places</label>
  <input
    id="town2-search"
    type="search"
    bind:value={searchText}
    class="search-input"
    placeholder="e.g. seat corn"
    spellcheck="false"
    autocomplete="off"
    enterkeyhint="search"
  />

  {#if queryPack.kind === "run" && queryPack.rows.matchesTotal !== 1}
    <p
      class="result-guidance"
      class:result-guidance--muted={queryPack.rows.matchesTotal === 0 ||
        (queryPack.state === "focused" && queryPack.rows.matchesTotal > 1)}
    >
      {#if queryPack.rows.matchesTotal === 0}
        No matches — try other parts or fewer.
      {:else if queryPack.rows.overflowCount > 0}
        {queryPack.rows.matchesTotal} matches — first {MAX_VISIBLE_RESULTS} shown as a sample. Add another part to narrow, then pick one.
      {:else}
        {queryPack.rows.matchesTotal} matches — pick one.
      {/if}
    </p>
  {/if}

  {#if queryPack.kind === "run" && queryPack.rows.matchesTotal > 0}
    <ul class="results">
      {#each pickerResultKeys as townId, i (townId)}
        <li class="results__item">
          {#if resultsAreSelectable}
            <button type="button" class="place-button" onclick={() => chooseByKey(townId)}>
              {visibleRowLabels[i]}
            </button>
          {:else}
            <span class="place-preview">{visibleRowLabels[i]}</span>
          {/if}
        </li>
      {/each}
    </ul>
    {#if queryPack.rows.overflowCount > 0}
      <p class="results-overflow-tail">And more</p>
    {/if}
  {/if}
</main>

<style>
  .route {
    display: grid;
    gap: 0.6rem;
    max-width: 34rem;
  }

  .search-prompt {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.35;
    color: var(--text-document-secondary);
  }

  .result-guidance {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-document-emphasis);
  }

  .result-guidance--muted {
    font-weight: 400;
    color: var(--text-muted);
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
    border: 1px solid var(--border-control);
    border-radius: 0.5rem;
    font: inherit;
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
    color: var(--text-link-accent);
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;
    text-align: left;
  }

  .place-preview {
    display: block;
    font: inherit;
    font-weight: 400;
    color: var(--text-muted);
    text-align: left;
  }

  .results-overflow-tail {
    margin: 0.1rem 0 0;
    font-size: 0.92rem;
    font-weight: 400;
    color: var(--text-muted);
  }
</style>
