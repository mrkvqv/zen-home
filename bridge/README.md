# Zen Calendar Bridge

A small background app for macOS that gives the Zen Home extension read-only access to Apple Calendar events and to the list of Zen Essentials.

## Endpoints

All requests need `Authorization: Bearer <token>` and are answered only on `127.0.0.1:8766`.

| Endpoint                                | Returns                                                         |
| --------------------------------------- | --------------------------------------------------------------- |
| `GET /v1/status`                        | calendar access state                                           |
| `GET /v1/events?start=YYYY-MM-DD&end=…` | calendars and events in the range (up to 120 days)              |
| `GET /v1/pins`                          | Essentials from the saved Zen session: URL, title and icon only |

## Security

- Listens on the loopback interface only and checks the `Host` header.
- Allows only the `null` origin (a local file) or a `moz-extension://` origin; other sites get `403`.
- Read-only: every method except `GET` and the CORS preflight is rejected.
- Responses are sent with `Cache-Control: no-store`; nothing is written to disk except the token.
- The token lives in `~/Library/Application Support/ZenCalendarBridge/config.json` with owner-only permissions.

## Files

| File                   | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `CalendarBridge.swift` | HTTP server and EventKit access                     |
| `ZenPins.swift`        | reads Essentials from `zen-sessions.jsonlz4`        |
| `install.py`           | builds the app, creates the token and a LaunchAgent |
| `test_service.py`      | checks the running bridge without printing any data |
| `test_pins.swift`      | unit test for reading Essentials                    |

Run the unit test with:

```sh
xcrun swiftc -parse-as-library -lcompression bridge/ZenPins.swift bridge/test_pins.swift -o /tmp/test_pins && /tmp/test_pins
```
