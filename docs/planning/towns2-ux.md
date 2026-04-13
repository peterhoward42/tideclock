# Planning a changed UX for users to choose locations

## Context

- first read /docs/specs/elevator-pitch.md

- then look at /src/ui/routes/Location.svelte to see how the current UI works to choose a location,
and where it gets its data from.

## Problems with the current way of choosing locations

- the input data set is not very good because it doesn't represent the way humans
think about coastal locations, and it has patchy coverage

## Good things about the current way of choosing locations

- the UX is smooth and friendly

## This next task orientation

- I have been working on a much improved input dataset and a better UX for searching.

- You can see the shape of the new input data by looking at /tools/towns2/coastal-geocoded/chesire.tsv, and noting that it has many sibling files that complete the data set (at the time of writing this is still being poplulated)

- The improved UX will use the new input data set as its source

- I am hoping to offer the user the ability to start typing not a prefix of the location they want, but
  one or more search fragments like this: "ches parkg" - and this would match "Parkgate march - Chesire" and some other locations.

- There is already a search engine to in model space to perform this kind of search in /src/location-services .

- I anticipate the location services module may need to be optimised for performance to be quick enough for
  a reactive UX as the user types key by key - but that can be looked at afterwards.

## This task

This task is to design the new UX logical presentation and interactive behaviour. Noting the following cases
 - In the early stages of the user beginning to type there will be a large number of matches that are unlikely to contain
    the user's required place - but should make it easy for them to see how to extend their search fragments so as to drill down.
 - The user will usually end up with a small set of matches that are frankly all good enough for them to choose to indicate the rough location they mean. The presence of multiple choices is more reinforcing that there are several places in one place with very similar names.

 The task is not to implement this yet - but to discuss how it would look and behave.

