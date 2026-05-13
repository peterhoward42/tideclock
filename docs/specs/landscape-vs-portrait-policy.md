# Policy for Landscape vs Portrait Display

## Constraints

- Users will spend the overwhelming majority of their time on the home route that shows the
tides diagram, and that diagram is designed deliberately to work well in landscape orientation.

- The second most used route is to change your location, and that, when on mobile needs to be shown in portrait mode - because the pop up keyboard in landscape mode takes away too much screen space for the UI to be viable. It doesn't matter on larger screens. 

- By default all the other routes do not have specific requirements for orientation.

## UX solutions in place at the moment

- If the user visits the home route, on mobile and in portrait mode - it displays the diagram properly, but it is fitted to the screens width, and thus is letterboxed, creating empy space above and below. In those circumstances, we position a message in the upper space to say "The diagram will be bigger if you turn your phone".

- If the user visits the locations route on mobile and in landscape mode, instead of showing the UI, we show a message telling them "On phones, switch to portrait orientation..." They can then rotate the device; the installed app is not locked to landscape-only at the OS level.

## Progressive Web Application Location context (PWA)

- The app can be installed as a PWA, and we provide an entry point in the menu for this to
explain the merit of doing so - mainly:
    - landscape on the home screen after you interact (best-effort API lock), not a manifest that forbids rotation
    - trying to keep the screen on unless running of battery
    - full screen display

- On the change-location route we release that lock so the phone can rotate to portrait. The web app manifest uses a rotation-friendly default so “switch to portrait” remains actionable in standalone mode.