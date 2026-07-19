# BlacketTweaks

A userscript that adds quality-of-life features to Blacket.

> **Status: in development.** Features work but are still being tuned, expect rough edges, and expect things to change without notice. Selectors are matched against the site's current CSS class names, so a site update can break a feature until this script is updated to match.

## Installation

1. Install a userscript manager (Tampermonkey, Violentmonkey, etc.) in your browser.
2. Add `BlacketTweaks.user.js` as a new script.
3. Visit Blacket — the script runs automatically on every page (`document-idle`).

All features are **off by default**. Enable the ones you want from the new **BlacketTweaks** card on the `/settings` page.

## Features

Toggle any of these on/off from the Settings page. Some have a gear icon for extra configuration.

- **Profile Blooks** *(Stats)* — Adds a "Blooks" card under a profile's Friends list, showing that user's collection grouped by pack/set, with owned vs. locked blooks and quantities. Configurable: show blook names under icons, show/hide the search bar.
- **Copy User ID** *(Stats)* — Adds a "Copy User ID" button next to a profile's stats button for quickly grabbing a user's ID.
- **Join Date on Stats** *(Stats)* — Adds a "Join Date" tile to the Stats card showing when the account was created. Configurable date format (short / numeric / long).
- **Extra Stats** *(Stats)* — Adds User ID, Online Status, and Name Color tiles to the Stats card.
- **Double Leaderboard** *(Leaderboard)* — Shows the Tokens and EXP leaderboards side by side instead of needing to switch tabs.

## Contributing / feedback

This is a personal tweak script under active iteration, feel free to poke at `BlacketTweaks.user.js` directly if something breaks or you want to tweak behavior.
