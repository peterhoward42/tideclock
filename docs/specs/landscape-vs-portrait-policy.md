# foo

## Constraints

- Users will spend the overwhelming majority of their time on the home route that shows the
tides diagram, and that diagram is designed deliberately to work well in landscape orientation.

- The second most used route is to change your location, and that, when on mobile needs to be shown in portrait mode - because the pop up keyboard in landscape mode takes away too much screen space for the UI to be viable. It doesn't matter on larger screens. 

- By default all the other routes do not have specific requirements for orientation.

## UX solutions in place at the moment

- If the user visits the home route, on mobile and in portrait mode - it displays the diagram properly, but it is fitted to the screens width, and thus is letterboxed, creating empy space above and below. We then position a message in the upper space to say "The diagram will be bigger if you turn your phone".

- If the user visits the locations route on mobile and in landscape mode, instead of showing the UI, we show a message telling them "On phones, switch to portrait orientation..." (Note 1)

## Progressive Web Application Location context (PWA)

- The app can be installed as a PWA, and we provide an entry point in the menu for this to
explain the merit of doing so.

- The PWA config favours landscape orientation

- But the PWA has an unsolved problem due to (Note 1) above. More info to follow.