# Gotchas (each one cost real time)

## Local dev and testing
- **Stale dev servers keep ports.** An old `tsx scripts/dev.ts` keeps answering on its port with old code, so tests show "tool not found" or identical results after your edit. Use a fresh port every run (`PORT=3331 npm run dev`), find the owner (`Get-CimInstance Win32_Process` on Windows, `lsof -i :PORT` elsewhere), kill it by PID, and confirm the log says "listening" and not `EADDRINUSE` before trusting any test.
- The test runner must list **every** tool; otherwise it reports "Untested tools" and exits 1. Add each new tool in the same change.
- Run slow commands (tests, builds, installs) in the background and read only the tail or the error lines of the log.

## Upstream APIs
- **Probe before coding.** Check status, shape, date format, rate limit, redirect behaviour.
- A `301` from an API often means the host moved (`frankfurter.app` → `api.frankfurter.dev`). Use the new host; do not just follow redirects blindly in production.
- **Timeouts**: the template's default is 8 s. A slow source can need a per-call timeout (e.g. 22 s for Open Library, which took 5-9 s) while staying under Vercel's `maxDuration` (30 s). Drop slow server-side options like `sort=` and sort in code instead.
- **Wikidata SPARQL**: `UNION`, `BIND`, `FILTER(MONTH(...))` and the label service made queries time out (45 s+). Fast pattern: simple `VALUES` + triple patterns, `rdfs:label` with `FILTER(LANG(?l)="en")`, filter dates in code, cache for hours. Send a descriptive `User-Agent`.
- **Google News RSS** works without a key: `https://news.google.com/rss/search?q=…&hl=en-US&gl=US&ceid=US:en`. Parse `<item>` blocks, decode entities, strip the trailing ` - Source` from titles, cache ~5 min.
- Free APIs rate-limit by IP; on Vercel many users share egress IPs. Cache aggressively and surface 429 as a friendly message.
- Free-text fields (species, dates) are inconsistent: normalise and match loosely, and say so in the result.

## Data quality
- Community data contains errors and surprises (a real-world politician listed as "born today" in a fictional database). Name the source, and fix known errors with a small local override table instead of hiding them.
- Fixed "story event" tables are fine if short, hand-picked and labelled as such.

## claude.ai
- **claude.ai caches the tool list.** After deploying new tools or cards, the user must remove and re-add the connector.
- Cards only render in hosts that support MCP Apps; always return a useful text answer too.
- You cannot see the card from the server side. Say which UI paths (clicks, paging) were verified and which were not.

## Process
- When the user asks for **ideas**, give ideas only; do not edit files.
- Do not create git branches or push/deploy unless the user authorised it; commit messages end with the attribution line the environment requires.
- Don't add games or fixed/static outputs when the user wants the assistant to do something real (live data, generated files).
