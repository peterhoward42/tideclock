<script lang="ts">
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { navigate } from "../../infrastructure/router.js";
  import type { Town } from "../../data/townSchema";
  import {
    queryTowns2ByCountyAndNamePrefix,
    towns2ByTownId,
    towns2Counties,
    towns2StepbackLabelsByTownId
  } from "../../data/bakedTowns2";
  import { displayOptimisation } from "../displayOptimisation";

  interface Props {
    readonly setCurrentLocation: (town: Town) => void;
  }

  let { setCurrentLocation }: Props = $props();

  /** Snapshot from {@link displayOptimisation}; phone-vs-slate + aspect for location-route landscape gate. */
  let displaySnapshot = $state(get(displayOptimisation));

  const blockPhoneLandscapeChooser = $derived(
    displaySnapshot.likelyHandheldPhoneFormFactor && displaySnapshot.aspectClass === "landscape"
  );

  onMount(() => {
    const unsub = displayOptimisation.subscribe((v) => {
      displaySnapshot = v;
    });
    return unsub;
  });

  let selectedCounty = $state("");
  let placePrefix = $state("");

  const query = $derived(
    queryTowns2ByCountyAndNamePrefix(selectedCounty, placePrefix)
  );

  const visibleRows = $derived.by(() =>
    query.visibleTownIds
      .map((id) => {
        const town = towns2ByTownId.get(id);
        if (town === undefined) {
          return null;
        }
        return {
          id,
          town,
          label: towns2StepbackLabelsByTownId.get(id) ?? `${town.name} — ${town.county}`
        };
      })
      .filter((row): row is { id: string; town: Town; label: string } => row !== null)
  );

  function chooseTown(town: Town): void {
    setCurrentLocation(town);
    navigate("home");
  }

  function applyNarrowingAppend(append: string): void {
    placePrefix = `${query.normalizedPrefix}${append}`;
  }

  const guidance = $derived.by(() => {
    if (query.bucket === "need_input") {
      return `Choose a county or type at least ${query.minPrefixLength} letters from the start of the place name.`;
    }
    if (query.bucket === "no_matches") {
      if (query.normalizedCounty !== null) {
        return "No matches yet. Try a different start, or change county.";
      }
      return "No matches yet. Choose county or extend the start of the place name.";
    }
    if (query.bucket === "single_match") {
      return "One match found.";
    }
    if (query.bucket === "few_matches") {
      return `${query.totalMatches} matches — pick one.`;
    }
    if (query.bucket === "many_matches") {
      if (query.normalizedCounty === null) {
        return "Too many places. Choose county or type a bit more.";
      }
      return "Too many places. Type 1-2 more letters to narrow.";
    }
    return "Too many places. Choose county first.";
  });
</script>

<main class="route">
  {#if blockPhoneLandscapeChooser}
    <p class="phone-landscape-only-message">
      On phones, switch to portrait orientation to use this screen to change location.
    </p>
  {:else}
  <label class="field">
    <span class="field__label">Start typing a place name</span>
    <input
      type="search"
      bind:value={placePrefix}
      class="field__control"
      placeholder="loo"
      spellcheck="false"
      autocomplete="off"
      enterkeyhint="search"
    />
  </label>

  <label
    class="field"
    class:field--emphasized={query.bucket === "many_matches" ||
      query.bucket === "too_many_matches"}
  >
    <span class="field__label">County (optional)</span>
    <select bind:value={selectedCounty} class="field__control">
      <option value="">All counties</option>
      {#each towns2Counties as county (county)}
        <option value={county}>{county}</option>
      {/each}
    </select>
  </label>

  <p class="guidance">{guidance}</p>
  {#if query.bucket === "many_matches" || query.bucket === "too_many_matches"}
    <p class="guidance-detail">{query.totalMatches} places</p>
  {/if}
  {#if query.exactPrefixTownId !== null}
    {@const exactTown = towns2ByTownId.get(query.exactPrefixTownId)}
    {#if exactTown !== undefined}
      <button type="button" class="match-button" onclick={() => chooseTown(exactTown)}>
        Use {exactTown.name}
      </button>
    {/if}
  {/if}
  {#if query.normalizedCounty !== null &&
    (query.bucket === "many_matches" || query.bucket === "too_many_matches") &&
    query.narrowingAppends.length > 0}
    <div class="narrowing-suggestions">
      <p class="guidance-detail">Not sure what to type next? Try:</p>
      <div class="narrowing-suggestions__chips">
        {#each query.narrowingAppends as append (append)}
          <button
            type="button"
            class="narrowing-chip"
            onclick={() => applyNarrowingAppend(append)}
          >
            {query.normalizedPrefix}{append}...
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if query.bucket === "single_match" && visibleRows.length === 1}
    <button type="button" class="match-button" onclick={() => chooseTown(visibleRows[0].town)}>
      Use {visibleRows[0].label}?
    </button>
  {:else if query.bucket === "few_matches"}
    <ul class="results">
      {#each visibleRows as row (row.id)}
        <li class="results__item">
          <button type="button" class="match-button" onclick={() => chooseTown(row.town)}>
            {row.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  {/if}
</main>

<style>
  .route {
    display: grid;
    gap: 0.75rem;
    max-width: 34rem;
  }

  .phone-landscape-only-message {
    margin: 0;
    font-size: 1rem;
    line-height: 1.45;
    color: var(--text-document-default);
    max-width: 28rem;
  }

  .field {
    display: grid;
    gap: 0.3rem;
  }

  .field--emphasized {
    padding: 0.5rem;
    border: 1px solid var(--border-control);
    border-radius: 0.5rem;
    background: var(--surface-page-background);
  }

  .field__label {
    font-size: 0.92rem;
    color: var(--text-document-secondary);
  }

  .field__control {
    width: 100%;
    max-width: 100%;
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--border-control);
    border-radius: 0.5rem;
    font: inherit;
    background: var(--surface-page-background);
    color: var(--text-document-default);
  }

  .guidance {
    margin: 0.15rem 0 0.1rem;
    font-size: 0.92rem;
    color: var(--text-muted);
  }

  .guidance-detail {
    margin: -0.2rem 0 0.1rem;
    font-size: 0.82rem;
    color: var(--text-document-secondary);
  }

  .narrowing-suggestions {
    display: grid;
    gap: 0.35rem;
  }

  .narrowing-suggestions__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .narrowing-chip {
    border: 1px solid var(--border-control);
    border-radius: 999px;
    background: var(--surface-page-background);
    color: var(--text-document-default);
    font: inherit;
    font-size: 0.8rem;
    padding: 0.2rem 0.55rem;
    cursor: pointer;
  }

  .narrowing-chip:hover {
    border-color: var(--text-link-accent);
    color: var(--text-link-accent);
  }

  .results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
  }

  .results__item {
    margin: 0;
    padding: 0;
  }

  .match-button {
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
</style>
