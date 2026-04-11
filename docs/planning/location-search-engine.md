# This specifies an interface and implementation logic for a query function.

- The queryer hold state and must be constructed with the following mandatory arguments
    -  Search space // a list of strings
    -  Display space // another list of strings the same length as the search space

- The queryer exposes a query method that takes a single query string argument

- The logic of the query is as follows
    -  Clean the query input as appropriate, so as to reliably separate it on a       space-delimtted basis - produces a set of search fragments
    -  There being only one fragment is not an error, nor is there being zero
    -  Delegate the query logic to the query method described below

## The query method behaviour

query(query_fragments, maxResults)

- It should return N rows from the search space that contain all of the query fragments not exceeding maxResults
- It MUST short-circuit return early to reduce the performance overhead of trivial matches - like the only search fragment being the letter "A" for example.
- The return value should be an object that offers also:
    -  How many results were returned
    -  A list of sibling display names for the matched lines (same list index)

##  Produce also a test suite for this behaviour

##  Put his module and its test suite in /src/location-services directory.
