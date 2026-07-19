# BlacketTweaks

A userscript that adds quality-of-life features to Blacket, built as small, independent plugins ("mods") that get combined into one production script.

> **Status: in development.** Features work but are still being tuned, expect rough edges, and expect things to change without notice. Selectors are matched against the site's current CSS class names, so a site update can break a feature until this script is updated to match.

## Installing (for players)

1. Install a userscript manager — [Tampermonkey](https://www.tampermonkey.net/) or Violentmonkey.
2. Add [`blackettweaks.user.js`](blackettweaks.user.js) as a new script.
3. Visit Blacket — the script fetches the latest build straight from this repo's `main` branch every time the page loads, so you're always on the newest version. No reinstalling.
4. All features are **off by default**. Enable the ones you want from the new **BlacketTweaks** card on the `/settings` page.

If you'd rather not auto-fetch on every page load, you can instead install [`dist/blackettweaks.js`](dist/blackettweaks.js) directly as the userscript. It's the same build, just pinned to whatever was committed at install time — you'll need to reinstall it to pick up updates.

## How it's built

The repo is source-first: nothing in `dist/` is edited by hand.

```
BlacketTweaks/
├── core/                    Bootstrap and shared plumbing, always loaded first
│   ├── bootstrap.js         BlacketTweaks global, util helpers, settings storage, registerFeature
│   └── settings-panel.js    Renders the BlacketTweaks card on /settings
├── mods/                    One file per feature — drop a new file here to add a mod
│   ├── profile-blooks.js
│   ├── copy-user-id.js
│   ├── join-date-stat.js
│   ├── extra-stats.js
│   ├── double-leaderboard.js
│   ├── cleaner-chat-ui.js
│   ├── discord-type-chat.js
│   └── chat-timestamps.js
├── dist/
│   └── blackettweaks.js     Generated output — core + all mods, concatenated
├── build.js                 Build script (Node, no dependencies)
├── blackettweaks.user.js    The installable loader — fetches dist/blackettweaks.js on every page load
└── .github/workflows/build.yml   Rebuilds and commits dist/ automatically on every push
```

`build.js` reads every `.js` file in `mods/` (alphabetically) and stitches them together with `core/bootstrap.js` first and `core/settings-panel.js` last, wraps the result in a single IIFE, and writes `dist/blackettweaks.js`. A GitHub Actions workflow runs this automatically whenever `core/`, `mods/`, or `build.js` change on `main`, so `dist/` is always up to date without anyone building by hand.

Because `blackettweaks.user.js` re-fetches `dist/blackettweaks.js` on every page load, merging a new mod to `main` is the entire release process — players get it on their next refresh.

## Building locally

Requires Node.js, no other dependencies.

```
node build.js
```

This regenerates `dist/blackettweaks.js` from whatever is currently in `core/` and `mods/`.

## Adding a new mod

Each mod is a self-contained IIFE. Copy this template into a new file in `mods/`:

```js
(function MyFeature() {
    const FEATURE_KEY = "myFeature";

    if (!BlacketTweaks.registerFeature(
        FEATURE_KEY,
        "My Feature",           // label shown in the settings card
        "What this feature does.", // description shown in the settings card
        "General",              // category grouping in the settings card
        "fa-puzzle-piece"        // Font Awesome icon class
    )) return;

    // registerFeature returns whether the feature is currently enabled
    // (from the player's saved settings). Bail out above if it's off.

    BlacketTweaks.util.onExists(".some-selector", (el) => {
        // do the tweak
    });

    BlacketTweaks.log("My Feature loaded.");
})();
```

Useful things available on `BlacketTweaks` (defined in `core/bootstrap.js`):

- `BlacketTweaks.util.waitFor(check, { interval, timeout })` — poll until `check()` returns truthy.
- `BlacketTweaks.util.onExists(selector, fn)` — run `fn(el)` for every element matching `selector`, now and as new ones appear.
- `BlacketTweaks.util.onLocationChange(fn)` — fires on SPA navigation (pushState/replaceState/popstate).
- `BlacketTweaks.util.onViewedUserChange(fn)` — fires when the profile page's viewed user changes.
- `BlacketTweaks.util.openModal(bodyHtml)` / `BlacketTweaks.util.siteButtonHtml(id, text, color)` — Blacket-styled modal and button helpers.
- `BlacketTweaks.settings.isEnabled(key)` / `setEnabled(key, bool)` — per-feature on/off toggle, backed by `localStorage`.
- `BlacketTweaks.settings.getConfig(featureKey, configKey, default)` / `setConfig(...)` — per-feature configuration values, also `localStorage`-backed.
- `BlacketTweaks.registerFeature(key, label, description, category, icon, onConfigure?)` — registers the feature with the settings card and returns whether it's enabled. Pass `onConfigure` if your feature has a gear-icon settings popup (see `mods/profile-blooks.js` for an example).

Don't rely on load order between mods — `build.js` sorts `mods/` alphabetically, and mods should be independent of each other.

Once your file is in `mods/`, run `node build.js` to confirm it builds cleanly, then open a PR. Merging to `main` rebuilds `dist/` automatically and ships to every player on their next page load.

## Contributing / feedback

This is a personal tweak project under active iteration — feel free to open an issue or PR if something breaks, or if you want to add a mod of your own.
