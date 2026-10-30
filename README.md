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

With `npm run dev` running, open these paths on localhost:

| Scenario                    | Path / action                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Initial loading shimmer     | `/records?demo=loading` — adds a four-second delay                                           |
| Initial load error          | `/records?demo=initial-error` — select **Try again** to recover                              |
| Discussion load error       | `/records/record-001?demo=load-error` — select **Try again**                                 |
| Comment submission error    | `/records/record-002?demo=submit-error` — post a comment, then retry with the retained draft |
| Reply submission error      | `/records/record-001?demo=submit-error` — select **Reply**, post, then retry                 |
| Empty discussion            | `/records/record-002`                                                                        |
| Unavailable record          | `/records/missing`                                                                           |
| Successful comment or reply | `/records/record-001` — enter text and post                                                  |

Open each URL with a full page reload. Simulated failures happen once per session; refresh to repeat. These simulations only run in development. Use the language button to try the same flows in Arabic.
