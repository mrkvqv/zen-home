# Zen Home

[![Latest release](https://img.shields.io/github/v/release/mrkvqv/zen-home?label=version)](https://github.com/mrkvqv/zen-home/releases/latest)
[![License: MIT](https://img.shields.io/github/license/mrkvqv/zen-home)](LICENSE)

A personal start page for [Zen Browser](https://zen-browser.app), built as a Firefox extension: a clock, your Zen Essentials and Apple Calendar events — fast, local and with no external requests.

![Zen Home in the dark theme](docs/preview.png)

## Features

- **Opens where you expect it**: at Zen startup, from the toolbar button and with <kbd>⌃</kbd><kbd>⇧</kbd><kbd>H</kbd>. Keeps a single start tab in the current Space instead of piling up duplicates.
- **Essentials**: shows the tabs pinned to Zen Essentials. A click switches to the already open pinned tab, <kbd>⌘</kbd>-click opens the site in a new tab.
- **Calendar**: month grid with event dots and a day agenda. Each card shows its calendar as a colored tag; a click slides the details in from the right: a date or time tile, location, link, recurrence, alerts and attendees.
- **Four languages**: Russian, English, Polish and Belarusian, switched from the bottom-right corner. Dates and plural forms follow the language.
- **Light and dark theme** that follow macOS automatically.
- **Light on resources**: plain JavaScript modules with no framework and no build step; data refreshes every 30 seconds only while the page is visible.

## How it works

```
Zen Browser                              macOS
┌──────────────────────────┐   HTTP    ┌────────────────────────────┐
│ Zen Home extension       │ ────────▶ │ Zen Calendar Bridge.app    │
│  home.html + js/*.js     │ 127.0.0.1 │  EventKit → Apple Calendar │
│  background.js (tabs)    │   :8766   │  Zen session → Essentials  │
└──────────────────────────┘ ◀──────── └────────────────────────────┘
```

The extension cannot read Apple Calendar or tell Essentials apart from ordinary pinned tabs, so a tiny native helper does that: **Zen Calendar Bridge**, a Swift app that runs in the background.

- It listens only on `127.0.0.1:8766` and requires a bearer token.
- It accepts requests only from the extension's own origin.
- It is read-only and never writes to the calendar.
- Events are not stored on disk; the page keeps them in memory only. Only the list of Essentials is cached, so the page appears instantly.

Google calendars work too: add your Google account in macOS **System Settings → Internet Accounts**, and its calendars show up in Apple Calendar and on this page.

## Setup

Requirements: macOS 14+, Xcode Command Line Tools (`xcode-select --install`), Node.js 20+ and [pnpm](https://pnpm.io).

```sh
git clone https://github.com/mrkvqv/zen-home.git
cd zen-home
pnpm install
```

### 1. Install the calendar bridge

```sh
pnpm bridge:install
open ~/Applications/"Zen Calendar Bridge.app"   # allow Calendar access once
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/local.zen-calendar-bridge.plist
```

The installer builds the app into `~/Applications`, creates a private token in `~/Library/Application Support/ZenCalendarBridge` and adds a LaunchAgent that keeps the bridge running. Check it with `pnpm bridge:test`.

### 2. Try the extension

1. In Zen, open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick `src/manifest.json`.
3. Press <kbd>⌃</kbd><kbd>⇧</kbd><kbd>H</kbd>, run `pnpm bridge-key` to copy the token, paste it on the page and click **Save**.

A temporary add-on is removed when Zen restarts.

### 3. Install it permanently

Release builds of Zen only install add-ons signed by Mozilla. Signing is free, and an unlisted add-on is never published in the catalog.

**Ready-made build**: download the signed `.xpi` from [Releases](https://github.com/mrkvqv/zen-home/releases/latest) and drag it into a Zen window. To sign your own changes, use one of the options below.

**Through the website**: run `pnpm build`, then on [addons.mozilla.org](https://addons.mozilla.org/developers/addon/submit/distribution) choose **On your own** and upload `dist/zen_home-<version>.zip`. Once it is approved, install the signed `.xpi` from the version page.

**From the command line**: create [API credentials](https://addons.mozilla.org/developers/addon/api/key/), copy `.env.example` to `.env`, fill in both values and run `pnpm sign`. The signed `.xpi` appears in `dist/`.

Bump `version` in `src/manifest.json` before signing every new release.

## Project structure

```
src/                  the extension
├── manifest.json     permissions, home page override, keyboard shortcut
├── background.js     a single start tab, switching to Essentials
├── home.html         page markup
├── home.css          styles, light and dark theme
├── js/
│   ├── home.js       entry point that wires the modules together
│   ├── calendar.js   clock, date and month grid
│   ├── agenda.js     day agenda, event cards, calendar list
│   ├── pins.js       Essentials cards
│   ├── bridge.js     requests to the local bridge
│   └── dom.js        shared helpers
└── assets/           clock font (JetBrains Mono, OFL) and service icons
bridge/               Zen Calendar Bridge (Swift) with installer and tests
scripts/              signing and token helpers
```

## Commands

| Command               | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `pnpm start`          | runs a separate Zen with a temporary profile        |
| `pnpm lint`           | checks the extension against Mozilla's rules        |
| `pnpm build`          | builds an unsigned `.zip` in `dist/`                |
| `pnpm sign`           | signs the extension with Mozilla (needs `.env`)     |
| `pnpm format`         | formats the code with Prettier                      |
| `pnpm bridge:install` | builds and installs Zen Calendar Bridge             |
| `pnpm bridge:test`    | checks the running bridge without printing any data |
| `pnpm bridge-key`     | copies the bridge token to the clipboard            |

## Keyboard shortcut

<kbd>⌃</kbd><kbd>⇧</kbd><kbd>H</kbd> (Control+Shift+H) by default. Change it in `about:addons` → gear icon → **Manage Extension Shortcuts**.

## License

[MIT](LICENSE). The bundled JetBrains Mono font is licensed under the [SIL Open Font License](src/assets/fonts/OFL.txt).
