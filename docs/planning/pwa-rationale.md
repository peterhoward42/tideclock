# PWA Adoption Rationale for Tide Times App

## Purpose

This document clarifies *why* Progressive Web App (PWA) capabilities are being added to the Tide Times application, and equally importantly, which typical PWA features are **not** priorities.

The goal is to reduce ambiguity when collaborating with AI or other developers, and to keep implementation focused on a narrow, intentional set of outcomes.

---

## Core Intent

The Tide Times app aspires to feel less like a conventional website and more like a **dedicated instrument or appliance**.

A key use case is:
- A tablet or screen placed permanently (or semi-permanently) in a physical space
- Displaying the app continuously, often in a landscape orientation
- Minimal interaction once set up

The PWA architecture is being considered primarily as a way to **support this ambient, always-on usage mode with minimal friction**.

---

## Primary Objectives

### 1. Encourage and Support Landscape Orientation

- The UI is fundamentally designed for a **wide (landscape-biased) aspect ratio**
- Portrait layouts are visually poor and not a viable primary mode

Desired outcomes:
- Strongly encourage landscape use
- Where possible, **default to or lock landscape orientation** in installed contexts
- Provide graceful fallback messaging when orientation is unsuitable

---

### 2. Prevent Screen Sleep / Dimming

- The app is intended to be left running continuously
- Automatic screen dimming or sleep significantly degrades the experience

Desired outcomes:
- Use the **Screen Wake Lock API** where available
- Keep the display active during use
- Gracefully handle cases where wake lock is unavailable or revoked

---

### 3. Enable “Appliance-like” Installation

- Allow users to install the app to a home screen or device
- Launch in a **standalone, browser-chrome-free context**
- Reduce friction for repeat use and permanent display setups

Desired outcomes:
- Clean launch experience
- Fast startup
- Feels closer to a native app than a webpage

---

## Non-Goals (Explicitly Deprioritized)

The following common PWA features are **not primary motivations** for this project:

### Offline-First Functionality
- Tide data does not need to be fully available offline
- No complex caching or sync logic required at this stage

### Push Notifications
- No requirement for alerts or re-engagement notifications

### Background Sync
- No need for deferred actions or background data updates

### App Store Distribution
- No requirement to package or distribute via app stores

### Full Kiosk Mode
- Considered too invasive and restrictive
- Users should retain normal control over their device

---

## Implementation Philosophy

- Treat PWA features as **progressive enhancements**, not hard dependencies
- Maintain a functional experience in a normal browser tab
- Provide a **better, more appropriate mode when installed**
- Avoid overengineering service worker logic unless future needs justify it

---

## UX Implications

- When in portrait or unsuitable aspect ratio:
  - Show a clear, intentional “rotate device” experience
- When wake lock is active:
  - Optionally indicate this subtly to the user
- When installed:
  - Lean into the “instrument” feel with minimal UI chrome

---

## Summary

PWA is being used here not as a full platform shift, but as a **targeted set of capabilities** to support:

- Landscape-first presentation
- Persistent display without sleep
- Low-friction installation and reuse

Everything else is secondary.
