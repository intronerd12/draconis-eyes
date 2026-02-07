## Diagnosis
- `SUPABASE_SERVICE_ROLE_KEY` is empty in [config/.env](file:///c:/Users/Sachzie/Downloads/dragons-vision/backend/config/.env), so backend pings Supabase using the anon key.
- Current ping logic hits `GET /rest/v1/profiles?...` which commonly fails under RLS for anon users, so it reports `supabase_db: false` even if Supabase is reachable.
- Your `DATABASE_URL` uses a Supabase pooler hostname; direct TCP 5432 checks can time out on some networks, so we should not rely on raw Postgres connectivity checks.

## Changes To Make
1. **Make the Supabase health check RLS-safe**
   - Update [config/postgres.js](file:///c:/Users/Sachzie/Downloads/dragons-vision/backend/config/postgres.js) so `pingDatabase()` first calls a Supabase endpoint that doesn’t depend on table RLS (e.g. `GET /auth/v1/health` or `GET /auth/v1/settings`) using `SUPABASE_URL` + `SUPABASE_ANON_KEY`.
   - Only do a `profiles` table probe when `SUPABASE_SERVICE_ROLE_KEY` is present (to bypass RLS) and treat that as an optional “deeper” check.

2. **Stop auth endpoints from failing when profiles are protected by RLS**
   - Update [authController.js](file:///c:/Users/Sachzie/Downloads/dragons-vision/backend/controllers/authController.js) so `/api/auth/login` does not 500 if it can’t read `profiles`; it should still return a valid response with a default `role` (or infer admin via `ADMIN_EMAILS`).
   - For `/api/auth/register`, if `SUPABASE_SERVICE_ROLE_KEY` is missing but Supabase returns an `access_token`, attempt to upsert the user’s profile using that token (works if your RLS policy allows users to write their own profile). Otherwise, return success and rely on frontend or a DB trigger to create profiles.

3. **Keep `/status` accurate for the dashboard**
   - Ensure [server.js](file:///c:/Users/Sachzie/Downloads/dragons-vision/backend/server.js) uses the improved `pingDatabase()` so `/status` reports `supabase_db: true` whenever Supabase is actually reachable.

## Verification
- Restart backend and confirm `GET http://localhost:5000/status` returns `components.supabase_db: true`.
- Confirm `/api/auth/login` returns a JSON response (not 500) even if `profiles` is locked down.

## Notes (No breaking changes)
- No MongoDB will be reintroduced.
- I won’t print or commit secrets; the existing `.env` already contains keys, so we’ll keep changes strictly in code logic.