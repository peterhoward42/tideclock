# Tidal Appliance UI - brainstorm to inform architecture.

## This document
This document includes a chaotic and disorganised set of requirements, features and constraints for a UI web application that shows you the times at which high and low tides will occur in your chosen location in the UK.

It is chaotic and disorganised because I have assembled it from a chaotic stream of thought.

It is intended to be input to a structured analysis that will reveal a set of candidate separations-of-concern that we can use organise the repositories source in to start with that provides a good human readable separation of concerns, reduced barriers to iterative evolution, and an architecture that facilitates testability.


## The UI outline view

- Think of it as an appliance, perhaps semi permantently mounted inside a room.
- It will be configurable so that it holds a maritime geographic location - as lat/long
- The display will be dominated by SVG graphics that look superifically like a 12 hour analog clock face
- it will render the current time somehow, but that is not the primary information
- the primary information are the times at which the high and low water times will occur today at the home location (and their heights)
- it will fetch the necessary data from a proxy internet API that I have already created
- there will be a refetch cycle organised client side to fetch a new set of 3 day data at approximately 3 day intervals,and this data will be cached for continuous use on the clientside while it remains in date
- there will another higher frequency data evaluation of the time now in order to re-render the current time more frequently

- an important part of the visual display is a pattern to be rendered that symbolises the gradual transition of tide heights between the highs and lows - this will comprise a set of densely packed radial lines whose lengths are a proxy for the tide height at the implied time

- a hamburger menu in the header will provide routing a set of <N> other pages tbd, but likely to include:
    - configuring the location
    - about this app
    - acknowledgements
    - funding / sponsorship request

- the app will be written in the Svelte framework (not SvelteKit), and architected as a SPA with client side only virtual routing.
- the app will be designed to be served by Vercel as a static app.

- the code should be organised into groups coinciding with their architectural contribution role. For example some of the code will be in the
pure logic and data domain, while others will serve the visual and UI more directly
- the DOM will be designed to be reactive to viewport aspect, but probably not size
- the collaboration of view-models from views themselves will be nearly entirely done using Svelte's rune system - typically exporting compound data structures and display components programmed to be reactive to individual fields of said objects changing in value
- whereever practical it should have good quality automated tests
- there will need to be a cookies accepteance screen
