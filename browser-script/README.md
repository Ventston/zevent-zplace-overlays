# ZEvent Place Overlay - Modular Build System

This directory contains the modular source code for the zevent-place-overlay userscript, now split into multiple files for better maintainability.

## Project Structure

The userscript has been split into the following modules:

### Source Files (`src/` directory)

1. **`meta.js`** - Tampermonkey metadata header with script information, grants, and URLs
2. **`constants.js`** - Global constants and configuration variables
3. **`utils.js`** - Utility functions (logging, sanitization, time formatting)
4. **`overlay-manager.js`** - Core overlay management functions (loading, reloading, DOM manipulation)
5. **`ui-components.js`** - UI creation and management functions
6. **`event-handlers.js`** - Event handling functions for user interactions
7. **`network.js`** - API calls and version checking functions
8. **`styles.js`** - CSS styling and GM_addStyle call
9. **`main.js`** - Main execution logic and initialization

### Build System

- **`build-script.js`** - Node.js script that combines all source files into the final userscript
- **`package.json`** - Node.js project configuration
- **`zevent-place-overlay.user.js`** - Generated final userscript (output file)

## Building the Userscript

### Prerequisites

- Node.js installed on your system

### Build Process

1. Navigate to the `browser-script` directory
2. Run the build script:
    ```bash
    node build-script.js
    ```
3. The script will generate `zevent-place-overlay.user.js` with all modules combined

### Build Script Features

- Combines files in the correct dependency order
- Adds section separators for easy debugging
- Validates that all source files exist
- Reports final file size
- Overwrites the existing userscript file

## Development Workflow

1. **Edit source files** in the `src/` directory
2. **Run build script** to generate the combined userscript
3. **Install/Update** the generated `.user.js` file in Tampermonkey
4. **Test** the functionality on https://place.zevent.fr/

## Linked overlays and defaults

`overlays.json` carries two fields consumed by `src/links.js`:

- **`linkedIds`** — the other members of the **group**. Linked overlays are inseparable: activating
  one activates them all, removing one removes them all. The server resolves the whole connected
  component (`A–B` plus `B–C` ⇒ a single `{A, B, C}` group) and caps its size when a link is
  accepted, so the script has no graph to walk. Every member carries a link icon in the panel,
  naming the other members currently active.

    A group formed mid-event applies on the next refresh, without reloading the page:
    `newlyLinkedToAdd` compares the `linkedIds` just received against those of the previous sync.
    Only **new** ones trigger an add — a group already seen, then dismissed by the user, does not
    come back a minute later. One consequence: on the first run after a script update, active
    overlays hold no `linkedIds` yet, so their existing groups all apply at once.

- **`isDefault`** — an overlay activated on its own, without the user picking it (an admin call),
  and that they cannot remove: the remove button gives way to a 📌, and `removeWantedOverlay` turns
  the request down even when the call comes from somewhere else. The protection covers its whole
  group — without it, the removal would be undone on the next refresh, the default overlay pulling
  its teammates back in.

Both fields are optional: a server version that does not send them leaves the script behaving as
before.

## Link activation (`?overlay=`)

`https://place.zevent.fr/?overlay=les-lezarts` activates the overlay as the script loads: a
community lead hands out a link instead of an instruction — "open the panel, look for X, click".
The param repeats and accepts a list: `?overlay=a&overlay=b` and `?overlay=a,b` are equivalent, and
linked overlays (`linkedIds`) come along just as they do on a click in the panel.

The value is a **key**: the overlay's `slug`, or its `id`. The site copies the slug, which reads
better and is picked by the community, but an id still works — that is what keeps a link valid even
against an `overlays.json` served by a pre-slug server, where `mapPublicOverlays` falls back to the
id. Keys go through `idSanityCheck` (`src/query.js`, pure and tested); an unknown key is only
logged.

Activation is the panel's own: it is persisted in GM storage, the overlay outlives the visit, and
the user can remove it as usual.

Once every key is resolved, `applyQueryOverlays()` strips the param from the URL
(`history.replaceState`): without it, an F5 on the link would bring back an overlay the user has
just removed. The param is kept, on the other hand, when a key was not found — typically an
`overlays.json` that did not answer — so a reload gives it another chance.

Worth noting in `src/meta.js`: the `@match` is `https://place.zevent.fr/*`, not `.../`. A match
pattern's path is compared against the path **and** the query string, so the exact form did not
match a URL carrying `?overlay=...` and the script would not have run.

Server-side the slug is unique, derived from the name at creation (`les-lezarts`, `les-lezarts-2`…)
and editable by the community; renaming the overlay leaves it alone, so links already handed out
keep working.

## Analytics

Usage stats are collected by a self-hosted [Umami](https://umami.is/) instance. The tracker script is
never injected into place.zevent.fr — `src/analytics.js` posts events straight to the `/api/send`
collect endpoint at `analyticsUrl`, with no proxy in between. Umami answers that endpoint with
`Access-Control-Allow-Origin: *`, so the cross-origin POST needs no server-side setup.

Two consequences of going direct. The URL is frozen in every installed copy — a userscript cannot be
redeployed, so moving the Umami instance breaks collection for everyone who has not updated. And an ad
blocker that knows the domain drops events silently; a proxy on the API vhost would not have fixed
that, since the page is place.zevent.fr and both domains are third-party from it either way.

What is sent, per event: script version, hostname (prod vs mock), screen size, browser language, and
the event name. Umami is cookieless: it derives a session id server-side by hashing IP + user agent +
a rotating salt, and never stores the raw IP.

- **one pageview per script boot** — unique users, with the version carried in the URL (`/4.0.0`),
  so the Umami "Pages" report doubles as a version breakdown
- **`overlay-active`** — one event per overlay in use, once per day per browser. This is the one that
  ranks overlays by popularity: `wantedOverlays` is persisted, so an overlay picked weeks ago is still
  in daily use without ever firing `overlay-add` again. The daily guard (`analyticsLastDaily` in GM
  storage) keeps page reloads from inflating heavy users.
- **`overlay-add`** — the moment an overlay is picked. Answers discovery, _not_ usage: read it to see
  what people are finding, not what they run.
- **`symbols`** — colorblind symbols toggled on/off

Both overlay events carry `overlay` (the community name, readable in the report) and `id` (stable
across server-side renames). Custom overlays have one-off names and ids, so they collapse to a single
`overlay: custom` value instead of flooding the ranking.

Set `analyticsWebsiteId` in `src/constants.js` to the UUID of the Umami website entry. Leave it empty
and tracking is a no-op, which is how local builds behave by default.

Users can opt out at any time with the "Statistiques d'usage anonymes" checkbox in the settings panel,
opened by the gear button in the header; the choice is persisted through `GM_setValue` like the other
settings. Keep it reachable: the build is unminified and public (`minify: false` in `build-script.js`),
so anyone can read what the script sends, and a userscript running on someone else's site is held to a
higher bar than a website.

Events go out through plain `fetch`, like every other request the script makes. `GM_xmlhttpRequest`
would only buy delivery past content blockers, since it issues from the extension context rather than
the page — deliberately routing the one tracking call around a blocker the user installed, while the
functional calls stay on `fetch`, is not a trade worth making here. It would also cost `keepalive` and
require an extra `@grant`. Revisit only if a page CSP actually blocks the POST, which would show up as
a caught `TypeError` in the console.

## File Dependencies

The build script combines files in this order to ensure proper dependency resolution:

1. `meta.js` - Must be first (Tampermonkey metadata)
2. `constants.js` - Global variables used by other modules
3. `utils.js` - Utility functions used by other modules
4. `overlay-manager.js` - Core functionality
5. `ui-components.js` - UI functions that depend on overlay manager
6. `event-handlers.js` - Event handlers that use UI and overlay functions
7. `network.js` - Network functions that use utilities and UI
8. `styles.js` - CSS styling
9. `main.js` - Main execution logic (must be last)

## Benefits of Modular Structure

- **Maintainability**: Easier to locate and edit specific functionality
- **Readability**: Smaller, focused files are easier to understand
- **Collaboration**: Multiple developers can work on different modules
- **Testing**: Individual modules can be tested separately
- **Debugging**: Clear section separators in the built file help with debugging

## Original Functionality

The modular version maintains 100% compatibility with the original monolithic userscript, including:

- Overlay loading and management
- UI for overlay selection
- Network fetching of overlay lists
- Version checking
- All keyboard shortcuts and interactions
