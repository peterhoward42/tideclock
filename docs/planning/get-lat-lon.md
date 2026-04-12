# Designing a process to fetch latitude and longitude for towns

This task is to design a process to be performed by AI to lookup the latitude and
longitude of a list of UK places.

## The nature of the input list

- A **coastal** directory in this repo containing text files named by county. E.g **cornwall.txt**
- Each text file contains place names - one on each line

## The nature of the places to deal with
- The place names are of diverse types
- For example they can be:
    -  town, village or hamlet names
    -  a named tourist attraction
    -  a named beach
- Each place name is a name that a human would recognise as being a location on or near the coast.
- The place names may contain more than one place that a human might regards as being
  essentially the same. But they should be treated individually. Their almost-equivalence need not and should not be inferred nor used in the logic

## The problems scale

There number of input place names is greater than 10,000 and less than 50,000.

## The task

- Working out how to prompt cursor to perform this task in a way that is likely to succeed.
- It may include a preparatory step to optimise the shape of the input data
- It may need to be broken down into a smaller chunks to overcome token memory limitations of doing it all in one go. We have a precedent for tackling that kind of 
divisision if it is needed in /tools/towns2/scripts - which uses cursor's scripting abilities.
- The workings out and conclusions should be written in to a markdown file sibling to this one.
