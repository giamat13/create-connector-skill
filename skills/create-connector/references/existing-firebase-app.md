# Connector for an existing site that uses Firebase

Use this when the site already has Firebase Auth + Firestore and the connector must read and write the user's own data. Proven on two real apps (a trip planner and a request board). Do not use an admin service account: it bypasses `firestore.rules` and gives every link holder full access.

## Design: personal link = the user's own sign-in

1. The signed-in user clicks "Connect Claude" in the site. The page builds `https://<worker>/mcp?key=<refresh token>` from `auth.currentUser.refreshToken` and shows it with a copy button and a warning ("anyone with this link acts as you; signing out everywhere revokes it").
2. The connector trades the refresh token at `securetoken.googleapis.com/v1/token` for a short-lived ID token on every request (cache per isolate until expiry).
3. All Firestore calls go through the REST API with `Authorization: Bearer <idToken>`. Firestore sees the real user, so `firestore.rules` stay the only security boundary. No secrets in the connector except the public web API key.

Copy `templates/src/lib/session.ts` as is: `withKey(key, fn)` / `currentKey()` (AsyncLocalStorage) and `sessionFromRefreshToken(token, apiKey)`.

## Wiring

- **handler**: read `?key=`. If it matches `/^[A-Za-z0-9_.-]{40,600}$/`, run the whole request inside `withKey(key, ...)`. Optional fallback for tests: a shared `MCP_SECRET`, or a mock flag (for example `MY_APP_MOCK=1`) with an in-memory store.
- **store**: a `Store` interface (`get`, `list`, `query`, `commit`) with a REST implementation and a mock implementation, so `scripts/test-client.ts` runs without Firebase. Use `documents:commit` with `updateMask`, `REQUEST_TIME` transforms for server timestamps, and `updateTime` preconditions for optimistic concurrency (`ConflictError`).
- **codec**: write the Firestore value encode/decode once (`stringValue`, `integerValue`, `mapValue`, `arrayValue`, `timestampValue`, `nullValue`).
- **tools** mirror what the UI does, using the same collections and field names as the site's JS. Read the site's data layer first and copy its write shapes exactly; rules usually validate field sets.
- **env**: `FIREBASE_API_KEY` and `FIREBASE_PROJECT_ID` (both public), plus optional `SITE_URL`. Take them from the site's `firebase-config.js`.

## Hosting: Cloudflare Workers (no Vercel needed)

`wrangler.toml`: `main = "src/worker.ts"`, `compatibility_flags = ["nodejs_compat", "nodejs_compat_populate_process_env"]`, a recent `compatibility_date`. The worker entry serves `/mcp` and `/` and forwards to the same `handler`. Deploy with `npx wrangler login` then `npx wrangler deploy --var FIREBASE_API_KEY:... --var FIREBASE_PROJECT_ID:...`. The "Deploy to Cloudflare" button can fail with an expired GitHub authorization; the CLI always works.

## Site side (the card)

- Add a small component shown only when signed in (not anonymous). Keep the connector URL in one config constant; hide the card while it is still a placeholder.
- Never store or log the link. Build it on click.
- If the site is on GitHub Pages, add the Pages domain (`<user>.github.io`) to Firebase Authentication > Settings > Authorized domains, or sign-in fails there.

## Firebase App Check

If App Check is enforced for Firestore, REST calls without a token are rejected. Register a debug token in the Firebase console (App Check > Apps > Manage debug tokens), set it on the Worker as `APPCHECK_DEBUG_TOKEN` and the web app id as `FIREBASE_APP_ID`, exchange it at `firebaseappcheck.googleapis.com/v1/projects/<id>/apps/<appId>:exchangeDebugToken`, and send the result in the `X-Firebase-AppCheck` header. If App Check is not enforced, skip all of this (the request-board app worked without it).

## Verify

1. `npm test` against the mock store: every tool covered.
2. Live: call a read tool with a real link, then a write tool and its reverse (create then delete), and check the result in the site's UI.
3. Expect `Your Claude link is no longer valid` when the link is wrong or the user signed out everywhere; tell the user to create a new link in the app.

## Pitfalls

- Email/password sign-in errors like `auth/invalid-email` come from the site's login form, not the connector.
- A refresh token placed in the URL ends up in logs; do not log request URLs.
- Rules that need `request.time` or server-set fields: use the `REQUEST_TIME` transform, not a client timestamp.
- After deploying, the user must remove and re-add the connector in claude.ai to refresh the tool list.
