<script lang="ts">
  /**
   * Location.svelte — Search and pick a town; calls back into the shell to persist selection.
   * Kind: Presentation. Does not write storage directly.
   */
  import { navigate } from "../../infrastructure/router.js";
  import { type Town, bakedTowns } from "../../data/bakedTowns";

  interface Props {
    readonly setCurrentLocation: (town: Town) => void;
  }

  const MAX_VISIBLE_RESULTS = 6;
  const title: string = "Location";

  let { setCurrentLocation }: Props = $props();
  let searchText = $state("");

  function scoreTownName(name: string, query: string): number {
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith(query)) {
      return 0;
    }
    if (lowerName.split(/\s+/).some((word) => word.startsWith(query))) {
      return 1;
    }
    if (lowerName.includes(query)) {
      return 2;
    }
    return -1;
  }

  const normalizedQuery = $derived(searchText.trim().toLowerCase());
  const matchedTowns = $derived.by(() => {
    if (normalizedQuery.length === 0) {
      return [];
    }

    const scored: { town: Town; score: number }[] = [];
    for (const town of bakedTowns) {
      const score = scoreTownName(town.name, normalizedQuery);
      if (score !== -1) {
        scored.push({ town, score });
      }
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.town.name.localeCompare(b.town.name);
    });
    return scored.map(({ town }) => town);
  });
  const matchCount = $derived(matchedTowns.length);
  const visibleTowns = $derived(matchCount <= MAX_VISIBLE_RESULTS ? matchedTowns : []);

  function chooseTown(town: Town): void {
    if (import.meta.env.DEV && import.meta.env.MODE !== "test") {
      console.log("[tideclock] location:", "chooseTown invoked", {
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
  <p class="helper">Start typing a town name to set your location.</p>

  <label class="search-label" for="town-search">Town</label>
  <input
    id="town-search"
    type="search"
    bind:value={searchText}
    class="search-input"
    placeholder="e.g. Newhaven"
    spellcheck="false"
    autocomplete="off"
    aria-describedby="search-feedback"
  />

  <section class="feedback" id="search-feedback" aria-live="polite">
    {#if normalizedQuery.length === 0}
      <p class="muted">Type at least one character to start searching.</p>
    {:else if matchCount === 0}
      <p class="muted">No towns match "{searchText.trim()}". Try a different spelling.</p>
    {:else if matchCount > MAX_VISIBLE_RESULTS}
      <p class="muted">
        {matchCount} towns match "{searchText.trim()}". Keep typing to narrow your search.
      </p>
    {:else if matchCount === 1}
      <div class="single-result">
        <p>
          1 town found:
          <button type="button" class="town-name-button" onclick={() => chooseTown(visibleTowns[0])}>
            {visibleTowns[0].name}
          </button>
          ({visibleTowns[0].county}, {visibleTowns[0].country})
        </p>
      </div>
    {:else}
      <p class="muted">Pick one of these towns:</p>
      <ul class="results">
        {#each visibleTowns as town (town.id)}
          <li>
            <p class="result-row">
              <button type="button" class="town-name-button" onclick={() => chooseTown(town)}>
                {town.name}
              </button>
              <span class="meta">({town.county}, {town.country})</span>
            </p>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  .route {
    display: grid;
    gap: 0.75rem;
    max-width: 34rem;
  }

  .helper,
  .muted {
    color: #4b5563;
    margin: 0;
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
  }

  .single-result {
    display: grid;
    gap: 0.6rem;
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

  .town-name-button {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    color: #1d4ed8;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;
  }

  .meta {
    color: #4b5563;
    font-size: 0.93rem;
  }
</style>
