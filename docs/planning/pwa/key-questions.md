# Key questions to resolve for putting in PWA

## Caching

- The app has sophisticated application domain data fetching and caching from an
external API already. This is part of the product definition and I don't want that to change.
- But caching anything else for faster load is a useful win
- But given that this is a svelte app - I believe most of the shipped site is just javascript, and may not contain any html or css per se - but this needs to be confirmed
- In which case - how should we use PWA caching?
- I propose to update the app frequently - particularly in the early days, maybe several times a day. How does this play with caching on client side?

## Landscape orientation

- You will read in the rationale document the priorities for encouraging landscape display for the home route only.
- This is already implemented independently of PWA and should coexist with the improvements
  to landscape "nudging" that PWA can bring.
- The existing mechanism:
    -  Always provides a valid layout regardless, by letterboxing the diagram content onto the page available
    -  Detects the platform being a phone or tablet
    -  Reacts dynamically to changing aspect ratio
    -  In the particular case of (phone or tablet) and a portrait-ish aspect ratio it decorates the display in the empty letter box spaces with a brief note that says "The diagram will be bigger if you turn your phone".

## Always on screen

- The rationale explains the requirements for always on / screen brightness maintenance
- I realise that PWA cannot garauntee these things
- But what choices should we make about leveraging PWA to help with these things?