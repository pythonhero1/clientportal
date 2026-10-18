# Design system

## Priority

Stephen delegated this choice. Use the individual client screens as the visual authority where their colors differ from the older Foundations frame. The linked Notifications body is `5:266`; its containing screen is `5:261`. The Foundations frame is `1:55`.

The supplied file contains desktop frames. Responsive layouts and light mode are required extensions; they have no supplied reference frames. Propose them using the same hierarchy, spacing and controls, and verify them independently.

## Proposed semantic tokens

Dark values below come from the inspected Notifications screen. Light values are the selected design extension, not colors copied from an existing light Figma design. Verify effective contrast before implementation sign-off.

| Token | Dark | Light |
| --- | --- | --- |
| canvas | #070B12 | #F7F9FC |
| surface | #0B1320 | #FFFFFF |
| surface raised | #0B1423 | #EEF2F7 |
| inset surface | #07101D | #F8FAFC |
| border | #24334B | #CBD5E1 |
| text | #F5F7FB | #111827 |
| muted text | #919DB0 | #475569 |
| primary action | #2F6DF6 | #1D4ED8 |
| primary text link | #4C91FF | #1D4ED8 |
| success text | #24D7A1 | #047857 |
| warning text | #FFBD44 | #92400E |
| danger text | verify against relevant screen | #B91C1C |

Use Inter where available with a system fallback. Use rem for font sizes. Translate the 28 px desktop screen heading into 1.75 rem at a 16 px root; small badge text must remain readable at zoom. Do not lower the browser's root font to force the desktop composition onto a phone.

## Layout behavior

- Desktop: persistent sidebar, readable content width and multi-column panels where the frame shows them.
- Tablet: compact navigation and fewer columns, preserving every action and readable labels.
- Mobile: drawer navigation, stacked content and cards for wide tables where practical. Keep a scrollable calendar or agenda option rather than shrinking text beyond readability.
- Suggested implementation breakpoints: 48 rem and 64 rem. These are layout recommendations, not device restrictions.
- Theme follows the user's selected preference, with a system option as a proposed preference behavior. Persist the setting; verify the first render does not flash the opposite theme.

## Components

Build a consistent shell, buttons, fields, validation messages, badges, tabs, tables/cards, dialogs, drawers, toasts, empty states, upload progress, version timeline and calendar event display. Use accessible Radix primitives only where native controls need assistance. Preserve actual supplied visual assets and their proportions; never use screenshots as the implementation.

Use the Notifications screen's menu/content hierarchy, then check each actual screen for its own composition. Do not copy the selected Overview state into every screen. Client pages must not show Owner actions.

## Verification

Compare reference screenshots at the supplied desktop dimensions. Exercise widths around 390, 768, 1024 and 1440 CSS px, plus 200 percent zoom and keyboard-only operation, in both themes. These are test viewports, not a claim that mobile/tablet reference designs already exist.

Check normal text at 4.5:1 and large text/control boundaries as applicable at 3:1. Color alone must not identify a state. Check actual rendered combinations, focus rings, disabled controls and external embeds; a token table alone is insufficient.
