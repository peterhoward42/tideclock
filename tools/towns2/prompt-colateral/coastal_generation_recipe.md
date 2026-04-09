# Coastal Place Name Generation Recipe (Enhanced)

## Purpose
Generate a human-style, high-density list of coastal place names for a given county.
The goal is to support search-based location input, prioritising recall, redundancy, and human-like exploration over correctness.

## Core Behavioural Rules
- Simulate how a human explores and recalls a coastline
- Prefer density over cleanliness
- Prefer redundancy over efficiency
- Prefer local saturation over broad sampling

## Prompt Template
Generate a human-style list of coastal place names in [COUNTY].

Include:
- towns, villages, hamlets
- beaches, coves, bays
- headlands, harbours, local features

Guidelines:
- Redundancy is desirable
- Do NOT deduplicate
- Do NOT optimise or summarise
- Prefer names people might realistically type
- Include obscure and micro-locations

## Local Saturation Rule
When you enter a coastal region:
- stay in that area and expand it
- list nearby beaches, coves, and small places
- do not move on quickly
- exhaust the cluster before progressing

## Multi-Pass Strategy
Pass 1: Main Sweep
Pass 2: Density Expansion (aggressively add more names, even redundant)
Pass 3: Search Expansion (fallback names, partial names, nearby features)

## Anti-Summarisation Rule
- Do NOT merge similar places
- Do NOT replace clusters with umbrella names
- Do NOT clean or optimise the list

## Density Expectation
80–200+ names per county

## Post-Processing
- Combine all passes
- Keep duplicates
