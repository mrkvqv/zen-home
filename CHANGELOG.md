# Changelog

All notable changes to Zen Home are listed here. Versions follow the numbers signed on addons.mozilla.org.

## [1.1.0] — 2026-11-26

### Added

- Language switcher in the bottom-right corner: Russian, English, Polish and Belarusian. Dates, weekdays and plural forms follow the chosen language; the choice is saved, and the browser language is used by default.
- Event cards show their calendar as a colored tag next to the time.
- Multi-day events get a date tile (for example `23 – 26` with weekdays and times); timed events get a matching time tile with the duration.

### Changed

- Event details slide in from the right next to the title instead of expanding downwards; on narrow windows they still open below.
- A card opens and closes by clicking anywhere on it; the arrow flips with a soft animation, and closing is smoother.
- The title keeps its place when a card opens.
- English dates read "Wednesday, 23 December".

### Fixed

- All-day events no longer show a reversed date range like `25 – 24`.

## [1.0.2] — 2026-11-23

### Changed

- Calendar menu: visible calendars get a checkmark, hidden ones are clearly dimmed with a hollow dot.
- The calendar menu grows to fit all calendars instead of scrolling without a visible scrollbar.

## [1.0.1] — 2026-11-23

### Added

- Choose which calendars are shown: click a calendar in the **Calendars** menu to hide or show its events. The choice is saved in the extension settings.
- The menu button shows how many calendars are visible, for example `4 of 6`, and a **Show all** action appears when something is hidden.
- A separate message when all events of the day belong to hidden calendars.

## [1.0.0] — 2026-11-23

First signed release.

### Added

- Start page with a clock, Zen Essentials, a month calendar and the day agenda.
- Opens at Zen startup, from the toolbar button and with <kbd>⌃</kbd><kbd>⇧</kbd><kbd>H</kbd>; keeps a single start tab per Space.
- Event cards expand in place with the main details: time, calendar, location, link, recurrence, alerts and attendees.
- Blurred list edges, an end-of-list marker and a dashed placeholder for free days.
- Light and dark theme that follow macOS.
- Zen Calendar Bridge: a local read-only helper for Apple Calendar and Essentials.

[1.1.0]: https://github.com/mrkvqv/zen-home/releases/tag/v1.1.0
[1.0.2]: https://github.com/mrkvqv/zen-home/releases/tag/v1.0.2
[1.0.1]: https://github.com/mrkvqv/zen-home/releases/tag/v1.0.2
[1.0.0]: https://github.com/mrkvqv/zen-home/releases/tag/v1.0.0
