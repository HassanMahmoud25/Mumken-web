# Mumken Web

A responsive discussion app for browsing updates, posting comments, and replying to other users. Supports English and Arabic with LTR and RTL layouts.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Vitest.

## Run locally

Requires Node.js 20.9 or later.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Checks

```sh
npm test
npm run lint
npx tsc --noEmit
```

## Production

```sh
npm run build
npm start
```

For a Webpack build, use `npm run build -- --webpack`.

The app uses local sample data. Comments persist during the current session and reset on refresh.

## Demo scenarios

Open these paths on localhost or the deployed Vercel site:

| Scenario                    | Path / action                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Initial loading shimmer     | `/records?demo=loading` — delays initial loading, discussion opening, and submission by four seconds                                           |
| Initial load error          | `/records?demo=initial-error` — select **Try again** to recover                              |
| Discussion load error       | `/records/record-001?demo=load-error` — select **Try again**                                 |
| Comment submission error    | `/records/record-002?demo=submit-error` — post a comment, then retry with the retained draft |
| Reply submission error      | `/records/record-001?demo=submit-error` — select **Reply**, post, then retry                 |
| Empty discussion            | `/records/record-002`                                                                        |
| Unavailable record          | `/records/missing`                                                                           |
| Successful comment or reply | `/records/record-001` — enter text and post                                                  |

Open each URL with a full page reload. Simulated failures happen once per session; refresh to repeat. Explicit `?demo=...` scenarios work in development and production. Without a demo query, development and production both simulate the first opening of each discussion and comment/reply submissions for 1.2 seconds by default. Initial list loading is immediate unless `?demo=loading` is selected. `NEXT_PUBLIC_INITIAL_LOAD_DELAY_MS` configures this delay at build time (0 disables it, maximum 2000 ms). Use the language button to try the same flows in Arabic.

## Technical Decisions & Assumptions

### Assessment scope and supplied inputs

- The PDF defined the assessment requirements; the supplied JSON provided the local seed data, and Figma provided the visual direction. The required journey covers browsing records, viewing a discussion, commenting, and one level of replies; no backend was required.

### Design gaps and intentional interaction decisions

- **Missing records screen:** Figma supplied the discussion/details screen but omitted the `/records` listing. The listing was inferred from the PDF flow and multiple records in the JSON, using the same colors, typography, and visual language.
- **Visual refinements:** Spacing, header/content alignment, clipped text, icons, and responsive behavior were refined to make the supplied direction consistent and readable.
- **Motion:** Figma did not specify transitions or provide an interaction prototype. Subtle comment-entry and reply-disclosure animations were added for continuity, with reduced-motion support.
- **Collapsible replies:** Show/Hide controls were added to avoid excessive scrolling through long threads. Threads start expanded; selecting Reply or adding a reply reveals the relevant thread.
- **Shared composer:** Reply scrolls the existing composer into view and focuses it, avoiding an additional modal or inline editor. A “Replying to” bar identifies the author; Cancel returns to comment mode and keeps focus in the composer. This resolves reply behavior that was unspecified in the supplied design.
- **Validation and recovery:** Whitespace-only input is rejected after trimming; text is limited to 2,000 characters. Concurrent submissions are blocked, comments appear only after success, and failures retain the draft for retry. Loading, empty, unavailable, and error states complete unspecified edge cases.
- **Metadata:** A project title, description, and browser-tab icon were added as basic page metadata beyond the supplied design.

### Technical decisions

- **State and data:** React Context and a shared hook own session data, locale, loading, and submission state across routes. An in-memory repository clones the JSON seed and validates writes; comments and replies share a flat collection linked by record ID and parent ID. Successful writes update React state immutably. This scope does not need an additional state or data-fetching library.
- **Component boundaries:** The composer, comment threads, state views, and shared UI controls are separate components; mock request behavior lives behind the repository boundary. Drafts and reply selection remain local to the page/form; changing records resets the composer.
- **Localization:** Small English/Arabic dictionaries keep interface translations explicit without an i18n dependency. Locale controls document language/direction and date formatting; logical spacing and automatic text direction support mixed-language content. The selected language is saved in browser local storage and restored after refresh. If browser storage is unavailable, the selection lasts for the current visit. User-written comments remain in their original language.
- **Accessibility:** Native controls, semantic headings, a skip link, visible focus, contextual control names, linked validation guidance, status/error announcements, and composer focus handling support keyboard and screen-reader use.

### Assumptions and limitations

- The seeded current user stands in for authentication. Data survives client-side navigation but resets on refresh; the language preference persists in browser local storage. There is no durable storage for comments, backend synchronization, pagination, or multi-user conflict handling.
- Replies target root comments in the same record; counts include replies. Comment content is plain text, not HTML. Mock latency and one-time demo failures exercise recovery rather than model a production service.
- Inferred screens and interactions are implementation choices, not additional supplied design specifications. Accessibility checks support the implementation but do not constitute a guarantee of full WCAG conformance across assistive technologies.
