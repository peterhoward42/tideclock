<script lang="ts">
  import { navigate } from "../../infrastructure/router.js";
  import type { Town } from "../../data/townSchema";
  import {
    queryTowns2ByCountyAndNamePrefix,
    towns2ByTownId,
    towns2Counties,
    towns2StepbackLabelsByTownId
  } from "../../data/bakedTowns2";

  interface Props {
    readonly setCurrentLocation: (town: Town) => void;
  }

  let { setCurrentLocation }: Props = $props();
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
        return "Too many matches. Choose county or type a bit more.";
      }
      return "Too many matches. Type 1-2 more letters to narrow.";
    }
    return "Too many matches. Choose county first.";
  });
</script>

<main class="route">
  <label class="field">
    <span class="field__label">County (optional)</span>
    <select bind:value={selectedCounty} class="field__control">
      <option value="">All counties</option>
      {#each towns2Counties as county (county)}
        <option value={county}>{county}</option>
      {/each}
    </select>
  </label>

  <label class="field">
    <span class="field__label">Start of place name</span>
    <input
      type="search"
      bind:value={placePrefix}
      class="field__control"
      placeholder="e.g. sea"
      spellcheck="false"
      autocomplete="off"
      enterkeyhint="search"
    />
  </label>

  <p class="guidance">{guidance}</p>

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
</main>

<style>
  .route {
    display: grid;
    gap: 0.75rem;
    max-width: 34rem;
  }

  .field {
    display: grid;
    gap: 0.3rem;
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
