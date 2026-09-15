# Sentiment Analysis — frontend for your Spring Boot backend

A React + plain CSS frontend for your Spring Boot backend. No CSS frameworks or
UI component libraries — just React, plain CSS, and `fetch()`.

## 1. Install and run

```bash
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL if your backend isn't on localhost:8080
npm run dev
```

The app runs at `http://localhost:5173` by default.

**Your backend must allow this origin in CORS.** Your `SpringSecurity`
config reads `app.cors.allowed-origins` from `application.properties` — make
sure `http://localhost:5173` (or wherever you deploy the frontend) is in that
list, or every request will be blocked by the browser before it reaches your
API.

## 2. Environment variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of your Spring Boot backend, no trailing slash | `http://localhost:8080` |

## 3. How the frontend talks to your backend

Every API call goes through `src/services/apiClient.js`, which:

- Prefixes every request with `VITE_API_BASE_URL`.
- Attaches `Authorization: Bearer <accessToken>` automatically to any request
  that isn't one of the public auth endpoints.
- Reads the response body as text first and only parses it as JSON if it looks
  like JSON — your backend sometimes returns a raw string (e.g.
  `/api/auth/suggest-username`, or the login failure branch), sometimes JSON,
  sometimes nothing at all (204s, `POST /api/react`). This avoids crashing on
  any of those shapes.
- On a 401 from any authenticated endpoint, it automatically calls
  `POST /api/auth/refresh` once and retries the original request. If the
  refresh itself fails, the person is signed out and sent to `/login`.

Feature-specific calls live in `src/services/*.js` (one file per backend
controller: `authService`, `userService`, `postService`, `commentService`,
`reactionService`, `adminService`) — each function maps 1:1 to a real
endpoint with the exact field names your DTOs expect.

## 4. Authentication

- `POST /api/auth/login` returns `{ accessToken, refreshToken }`, both saved
  to `localStorage` (`src/utils/tokenStorage.js`).
- On every page load, if a saved access token exists, the app calls
  `GET /api/user/me` to rebuild the session (`AuthContext`). If that fails
  (expired/invalid token), the session is cleared and the person is treated
  as signed out.
- `ProtectedRoute` guards every page that needs a logged-in user;
  `AdminRoute` additionally checks `roles.includes("ADMIN")` before allowing
  `/admin`.
- Logging out calls `POST /api/auth/logout` with the refresh token, then
  clears local storage regardless of whether that call succeeds. "Log out
  everywhere" (in Profile settings) calls `POST /api/auth/logout-all`.

### JWT storage and refresh

Tokens are stored in `localStorage`, not cookies — your backend doesn't set
any cookies, it returns tokens directly in the JSON response, so this matches
how your API is built. When an access token expires mid-session, `apiClient`
transparently refreshes it once and retries — you won't see this happen as a
user, requests just succeed.

## 5. Signup and `/api/auth/suggest-username`

On the signup page, typing a name triggers (after a short debounce)
`GET /api/auth/suggest-username?userName=<name>`. The suggestion is shown and
pre-filled into the username field, but the person can freely edit it before
submitting — the frontend never assumes the suggestion is reserved or final,
exactly as specified. The actual account is only created when they submit
`POST /api/auth/sign_up`.

## 6. Posts, comments, reactions

- **Feed** (`GET /api/posts`) shows your own posts plus everyone's public
  posts, paginated with "Load more". Your backend caches this response in
  Redis for ~30 seconds per page — after publishing a new post, you may need
  to tap "Refresh now" (shown right after posting) if it doesn't appear
  immediately.
- **Post detail** (`GET /api/posts/{postId}`) shows the post, all its
  comments, and all its reactions in one call, including sentiment tags on
  each comment (`POSITIVE` / `NEUTRAL` / `NEGATIVE`, filled in by your AI
  pipeline — it may be briefly empty on a comment you just posted).
- **Reactions** use your toggle-based endpoint: tapping the same reaction
  again removes it, tapping a different one switches it. This is mirrored
  optimistically in the UI, then reconciled with the actual request.
- Only the current user can edit/delete their own post or comment, and only a
  post's owner can additionally delete (not edit) comments on their own post
  — matching your `LogicOfPosts` / `CommentService` ownership rules exactly.

## 7. Running the frontend against a real backend, step by step

1. Start your Spring Boot backend (make sure Mongo, Redis, and Kafka — used
   by your comment sentiment pipeline — are running, or comment creation may
   error).
2. Add `http://localhost:5173` to `app.cors.allowed-origins`.
3. `npm install && npm run dev` in this folder.
4. Sign up, then log in.

## 8. Endpoints integrated

All endpoints in `AuthController`, `UserController`, `FrontControllerOfPosts`,
`CommentController`, `ReactionController`, and `AdminInfo` are wired up.

## 9. Endpoints / behaviors NOT integrated, and why

- **WebSocket live updates** (`/ws`, `PostRealtimePublisher`) — not wired up.
  The DTO shape (`PostRealtimeUpdateDto`) is defined on your backend, but
  there's no documented topic-subscription contract in the code I could
  safely infer (e.g. whether the frontend should subscribe to
  `/topic/posts/{postId}` or something else). Wiring this up on a guess
  risked silently failing or subscribing to the wrong destination — let me
  know the intended topic pattern and I can add it.
- **Per-post "did I already react?" on the feed** — `PostResponseDto` (the
  shape `GET /api/posts` returns) doesn't include the current user's
  reaction, only the total count. So feed cards always start showing the
  neutral "React" state even if you already reacted; the count itself is
  always accurate, and it corrects itself as soon as you interact with it
  again. The post *detail* page doesn't have this limitation, since
  `PostDetailDto` includes every individual reaction with its `userName`.
- **Post visibility badge on the feed** — `PostResponseDto` also doesn't
  include `typeOfAccess`, so feed cards can't show a "Public"/"Private" tag.
  This isn't a problem for what you see (the feed only ever contains your own
  posts and public posts), just a cosmetic gap.

## 10. Known backend quirks the frontend works around (not bugs I introduced)

- `UsernameAlreadyExistsException` and ownership `AccessDeniedException`s
  aren't caught by a specific `@ExceptionHandler` in
  `GlobalExceptionHandler`, so they currently come back as
  **500 "Something went wrong"** rather than 409/403 with a specific message.
  The frontend just displays whatever message the backend sends — it doesn't
  invent a nicer one, so if you want a clearer message here, it needs a
  handler added on the backend.
- `POST /api/auth/logout-all` expects a query param named `userEmail`, but
  the backend actually matches it against the `userName` field. The frontend
  sends the signed-in username under that parameter name to match your
  actual implementation, not the parameter's name.
