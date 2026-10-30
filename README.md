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
