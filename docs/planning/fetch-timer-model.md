# Data Fetching Timing Model

## This describes the functional requirements for the data fetching
   model

- It is partly based on running timers
- It is partly based on certain times being reached
- It is partly based on recognising when current data will soon be obsolete
- It is partly based on app lifecycle and arbitrary app events

## Putting this into conceptual event based models

### Strictly Time based models

- Single Event at given future time if up
- Repeated event at given intervals

### Non time based models
- Event on start
- Explicit event from programming logic
