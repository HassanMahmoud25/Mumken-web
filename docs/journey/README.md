# Web walkthrough

[Project README](../../README.md)

Captured on November 2, 2026, from the local production build: 19 screenshots at 1280 × 900 or 390 × 844 for mobile-browser views. These complement the submitted Loom recordings. Some views are scrolled to show the form and thread; authored text stays in its original language.

## 1. Startup

On first load or refresh, the Mumken overlay covers font preparation for at least 1.2 seconds. It then fades into the skeleton, with a three-second fallback if the font stalls. The same overlay is used for both languages.

![Mumken startup overlay](01-startup.jpg)

## 2. Loading

Open `/records?demo=loading` with a full reload. The overlay fades into four skeleton cards, which remain until loading finishes.

| English | العربية |
| --- | --- |
| ![Loading in English](02-loading-en.jpg) | ![Loading in Arabic](02-loading-ar.jpg) |

## 3. Updates

Open `/records` and switch language. Titles, summaries, dates, and layout direction update. Open a card to view its discussion.

| English | العربية |
| --- | --- |
| ![Updates in English](03-records-en.jpg) | ![Updates in Arabic](03-records-ar.jpg) |

## 4. Empty discussion and validation

Open `/records/record-002` and submit an empty composer. The form shows validation feedback above the empty-discussion message. Whitespace-only text is also rejected.

| English | العربية |
| --- | --- |
| ![Empty discussion and validation in English](04-empty-validation-en.jpg) | ![Empty discussion and validation in Arabic](04-empty-validation-ar.jpg) |

## 5. Failed comment

Open `/records/record-002?demo=submit-error`, enter text, and submit. The first attempt fails and keeps the draft. Switching language preserves it too. Retry posts the comment and clears the composer.

| English | العربية |
| --- | --- |
| ![Failed comment in English](05-comment-failure-en.jpg) | ![Failed comment in Arabic](05-comment-failure-ar.jpg) |

## 6. Failed reply

Open `/records/record-001?demo=submit-error`, choose Reply, enter text, and submit. The error keeps both the draft and selected author for retry. Controls prevent duplicate posts while submission is pending.

| English | العربية |
| --- | --- |
| ![Failed reply in English](06-reply-failure-en.jpg) | ![Failed reply in Arabic](06-reply-failure-ar.jpg) |

## 7. Successful reply

After retrying the comment in step 5, reply to it. A green confirmation appears, the composer clears, and the reply is shown under its parent. Show/Hide toggles the thread.

| English | العربية |
| --- | --- |
| ![Successful reply in English](07-reply-success-en.jpg) | ![Successful reply in Arabic](07-reply-success-ar.jpg) |

## 8. Loading error

Open `/records?demo=initial-error`, then select Try again to restore the list. Discussion-load recovery can be tried at `/records/record-001?demo=load-error`; both were checked in English and Arabic.

| English | العربية |
| --- | --- |
| ![Loading error in English](08-load-error-en.jpg) | ![Loading error in Arabic](08-load-error-ar.jpg) |

## 9. Unavailable update

Open `/records/missing`. The screen explains that the update cannot be found and keeps the link back to the list. There is no composer.

| English | العربية |
| --- | --- |
| ![Unavailable update in English](09-unavailable-en.jpg) | ![Unavailable update in Arabic](09-unavailable-ar.jpg) |

## 10. Mobile browser

At 390 × 844, post a comment on `/records/record-002`. The form stacks vertically and shows the success message. Switching language preserves the posted text.

| English | العربية |
| --- | --- |
| ![Mobile browser in English](10-mobile-success-en.jpg) | ![Mobile browser in Arabic](10-mobile-success-ar.jpg) |

## Review results

The browser walkthrough also checked:

- Cancelling reply mode keeps the draft; starting a new draft clears the success message.
- Hide/Show controls work independently for each thread.
- Comments and replies survive client-side navigation.
- Refresh resets submitted content while preserving the chosen language.
- Initial-load and discussion-load retries work in both languages.
- No browser warnings or errors were captured during the walkthrough.

Failures use explicit demo scenarios, not a live backend. Reload the page to repeat a one-time failure.

All 82 tests across eight files, lint, and TypeScript checks passed on November 2, 2026. Tests cover validation, session state, ordering, recovery, duplicate posts, reply controls, localization, dates, and startup behavior. See the [check commands](../../README.md#checks).

The production build passed with Webpack. Turbopack could not start its local worker in this environment. Screenshots are functional checks; they do not replace a current Lighthouse run or full assistive-technology testing.
