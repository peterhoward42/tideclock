<script lang="ts">
  /**
   * LocationTowns2.svelte — Prototype coastal place search using fragment AND matching
   * ({@link SearchSpaceQueryer}) over the towns2 baked dataset. Calls the shell to persist selection.
   */
  import { navigate } from "../../infrastructure/router.js";
  import type { Town } from "../../data/bakedTowns";
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

  const title = "Location (new search)";

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
  <h1>{title}</h1>
  <p class="helper">
    Type words separated by spaces. Every word must appear somewhere in the place (order does not
    matter). Example: <span class="mono">park chesh</span> for Parkgate in Cheshire.
  </p>

  <label class="search-label" for="town2-search">Search</label>
  <input
    id="town2-search"
    type="search"
    bind:value={searchText}
    class="search-input"
    placeholder="e.g. neston cheshire"
    spellcheck="false"
    autocomplete="off"
    aria-describedby="town2-search-feedback"
  />

  <section class="feedback" id="town2-search-feedback" aria-live="polite">
    {#if queryPack.kind === "idle"}
      <p class="muted">Start typing to search the coastal places list (prototype dataset).</p>
    {:else if queryPack.totalMatchingRows === 0}
      <p class="muted">No places match that search. Try different words or fewer words.</p>
    {:else}
      {#if queryPack.totalHitCountCeiling}
        <p class="lead">
          Too many places still match. Add another word (or a more specific fragment) to narrow down.
        </p>
        <p class="muted">
          There are more than {MATCH_COUNT_CEILING - 1} matches; only the first {MAX_VISIBLE_RESULTS}
          are listed below in list order.
        </p>
      {:else if queryPack.totalMatchingRows > MAX_VISIBLE_RESULTS}
        <p class="lead">
          Several places match. Add another word if this list feels too broad.
        </p>
        <p class="muted">
          {queryPack.totalMatchingRows} places match; showing the first {MAX_VISIBLE_RESULTS} in list
          order.
        </p>
      {:else if queryPack.totalMatchingRows === 1}
        <p class="lead">One place matches:</p>
      {:else}
        <p class="lead">These places all match — pick the one you mean:</p>
      {/if}

      {#if queryPack.totalMatchingRows > 0}
        <ul class="results">
          {#each queryPack.resultKeys as townId, i (townId)}
            <li>
              <p class="result-row">
                <button type="button" class="place-button" onclick={() => chooseByKey(townId)}>
                  {queryPack.displayNames[i]}
                </button>
              </p>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </section>

  <p class="lab">Prototype route — the classic Location screen is unchanged under Menu → Location.</p>
</main>

<style>
  .route {
    display: grid;
    gap: 0.75rem;
    max-width: 34rem;
  }

  .helper,
  .muted,
  .lab {
    color: #4b5563;
    margin: 0;
  }

  .lab {
    font-size: 0.88rem;
    margin-top: 0.5rem;
  }

  .mono {
    font-family: ui-monospace, monospace;
    font-size: 0.92em;
  }

  .lead {
    margin: 0;
    font-weight: 600;
    color: #111827;
  }

  .search-label {
    font-weight: 600;
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
    min-height: 6rem;
    display: grid;
    gap: 0.45rem;
  }

  .results {
    list-style: none;
    margin: 0.3rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
  }

  .result-row {
    margin: 0;
  }

  .place-button {
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
