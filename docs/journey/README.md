# Web journey: English and Arabic

[Back to the project README](../../README.md)

Captured on November 2, 2026, from the local production build (`npm start`), using the supplied sample data. Desktop viewports are 1280 × 900; mobile-browser viewports are 390 × 844. These are web screenshots, not screenshots of the native Expo app. The gallery complements the Loom recordings submitted with the assessment.

There are **19 screenshots across 10 stages**: a shared startup screen, eight English/Arabic desktop pairs, and a mobile-browser pair. Click any image to inspect it at its original size. Some views are scrolled to keep the composer, feedback, and relevant thread in frame. User-authored content retains its original language when the interface language changes.

## 1. Open or refresh the website

A full-screen Mumken logo and gradient cover font preparation for at least 1.2 seconds. A three-second fallback prevents a stalled font request from blocking the app. This visual is shared by both languages, so it is shown once.

![Mumken startup overlay](01-startup.jpg)

## 2. Hand off to the loading placeholders

Open `/records?demo=loading` with a full reload. After the overlay fades, four skeleton cards retain the list geometry. The skeleton remains while data is loading; normal navigation does not replay the startup overlay.

| English | العربية |
| --- | --- |
| ![Hand off to the loading placeholders in English](02-loading-en.jpg) | ![Hand off to the loading placeholders in Arabic](02-loading-ar.jpg) |

## 3. Browse the published updates

Open `/records`. Four update cards show localized titles and summaries, publication dates, and actions to open the discussion. Switching language changes the interface and layout direction between English/LTR and Arabic/RTL.

| English | العربية |
| --- | --- |
| ![Browse the published updates in English](03-records-en.jpg) | ![Browse the published updates in Arabic](03-records-ar.jpg) |

## 4. Open an empty discussion and validate input

Open `/records/record-002`, then submit an empty composer. The record remains readable, the discussion explains that it has no comments, and the form displays localized validation feedback. Empty or whitespace-only text is not submitted.

| English | العربية |
| --- | --- |
| ![Open an empty discussion and validate input in English](04-empty-validation-en.jpg) | ![Open an empty discussion and validate input in Arabic](04-empty-validation-ar.jpg) |

## 5. Recover from a failed comment

Open `/records/record-002?demo=submit-error`, enter a comment, and submit. The first submission fails deliberately. The draft remains editable and the localized error explains how to retry. These images also show that changing interface language preserves the same draft. Retrying succeeds and clears the composer.

| English | العربية |
| --- | --- |
| ![Recover from a failed comment in English](05-comment-failure-en.jpg) | ![Recover from a failed comment in Arabic](05-comment-failure-ar.jpg) |

## 6. Keep the reply target and draft after failure

Open `/records/record-001?demo=submit-error`, choose Reply on an existing comment, enter text, and submit. The shared composer identifies the selected author. The failed reply preserves both its text and target; the user can retry or cancel reply mode. During submission, controls prevent duplicate posts and target changes.

| English | العربية |
| --- | --- |
| ![Keep the reply target and draft after failure in English](06-reply-failure-en.jpg) | ![Keep the reply target and draft after failure in Arabic](06-reply-failure-ar.jpg) |

## 7. Publish a reply and reveal its thread

After retrying the comment in stage 5, select Reply on that new comment and post a reply. The green confirmation announces success, the composer clears, the total includes the new reply, and the reply appears one level beneath its parent. The same session is shown in both interface languages. Show/Hide controls collapse and reveal the thread.

| English | العربية |
| --- | --- |
| ![Publish a reply and reveal its thread in English](07-reply-success-en.jpg) | ![Publish a reply and reveal its thread in Arabic](07-reply-success-ar.jpg) |

## 8. Recover from a loading error

Open `/records?demo=initial-error`. The localized error provides a Try again action; retry restores the list. The separate `/records/record-001?demo=load-error` scenario exercises discussion-load recovery and was also checked in both languages; it uses the same error treatment, so a second pair of error screenshots is omitted.

| English | العربية |
| --- | --- |
| ![Recover from a loading error in English](08-load-error-en.jpg) | ![Recover from a loading error in Arabic](08-load-error-ar.jpg) |

## 9. Handle an unavailable update

Open `/records/missing`. The screen explains that the update could not be found and retains navigation back to the list. A comment form is not presented for a missing record.

| English | العربية |
| --- | --- |
| ![Handle an unavailable update in English](09-unavailable-en.jpg) | ![Handle an unavailable update in Arabic](09-unavailable-ar.jpg) |

## 10. Use the same journey in a mobile browser

At a 390 × 844 viewport, open `/records/record-002` and post a comment. The composer and its action stack vertically, the green confirmation appears below the composer, and the submitted comment is visible. Switching language preserves the posted content while adapting the layout direction. This is a browser viewport check, not a physical-device or native-keyboard test.

| English | العربية |
| --- | --- |
| ![ Use the same journey in a mobile browser in English](10-mobile-success-en.jpg) | ![ Use the same journey in a mobile browser in Arabic](10-mobile-success-ar.jpg) |

## Verification beyond the screenshots

The following checks were exercised during this walkthrough. Transient and repeated states are recorded here rather than adding more images.

| Check | Observed result |
| --- | --- |
| First visit / full refresh | Overlay → existing skeleton → content; four cards on the list. |
| Language switching | English/LTR and Arabic/RTL render correctly; switching preserves draft and authored content. |
| Failed comment and reply submissions | Text is retained; a failed reply also retains its target. Retry succeeds. |
| Comment and reply success | Green, translated confirmations appear; the composer clears and counts update. |
| Reply cancellation | Cancelling reply mode preserves the entered draft for a normal comment. |
| Thread controls | Hide removes the visible reply; Show reveals it again. |
| Client-side navigation | Posted comment and reply remain when returning to their record; startup overlay does not replay. |
| Full refresh / session reset | Newly posted comments and replies reset to the sample seed; the Arabic selection remains. |
| Initial-load and discussion-load errors | Try again restores the list or discussion, in both languages. |
| Missing update | Unavailable message and return navigation appear, without a composer. |
| Mobile-browser layout | Posting and language switching work at 390 × 844. |
| Browser console | No warnings or errors were captured during the walkthrough. |

Submission and loading failures above are explicit demo scenarios, not live backend failures. Each demo failure occurs once in a session; use a full page reload to repeat it.

## Automated checks

Run from the repository root:

```sh
npm test
npm run lint
npx tsc --noEmit
```

All **82 tests across 8 test files** passed on November 2, 2026; lint and TypeScript checks also passed. Coverage includes repository validation and session isolation, root/reply ordering, loading and demo behavior, form validation, failed-draft recovery, duplicate-submission prevention, localized success feedback, reply context, thread disclosure, timezone display, and the startup/font fallback handoff. These are automated unit and component checks; the browser walkthrough above was performed separately.

The production build used for this gallery passed with `npm run build -- --webpack`. The default Turbopack build could not complete in this task environment because its local process/port operation was denied. The earlier Lighthouse captures remain in the main README and predate the startup changes; these screenshots are functional evidence, not a fresh performance audit or full assistive-technology certification.
