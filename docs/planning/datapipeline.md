# Dynamic Data pipeline

This is the sourcing and applying of data conceptually and rough intervals, not about timing implementation.

##  Classes of data

- 3 day tide data
- tide times today
- time now

## Uses of data

- Display high and low tides today
- Display tide shape today
- Show time now

## Data Lifecycle demands

### For 3 day data

- on start
- mid runtime when nearing exit of envelope
- when location set or changed
- daylight saving transition

## For tidetimes today

- on start
- at local midnight

## Data lifecycle resource optimisation

- Defer thinking about this