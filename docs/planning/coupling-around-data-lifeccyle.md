# How to manage coupling to tide data model

## Concerns to seperate (potentially)

- fundamental source data state in memory
- a local storage cache for the fundamental source data
- derived data / query capability
- network fetch new data
- time based fundamental data fetch orchestrators
- explicit data fetch mandates
- pub/sub

## Scope design

### Fundamental model
- an ordered set of extremes in memory

### A cache
- Of the fundamental model in local storage with read/write api

### Rich derived model
- Modelling capabilities to expose derived data
- Types composition with stateless query API

### Batch fetcher
- Knows hows to fetch new fundamental data

### Batch fetch propagator
- Knows how to update the fundamental data given new fetched data

### Scheduler
- Owns a set of conceptually named timers
- Exposes an api to set/override/start these timers

### Timer event propagator
- Owns subscribers to Scheduler events
- Owns the propagation responsibilities for these events