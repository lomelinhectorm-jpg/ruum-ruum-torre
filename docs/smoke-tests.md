# Smoke tests

Run these manually after each deployment until automated end-to-end tests are added.

## Authentication

- Visit `/` logged out and confirm redirect to `/login`.
- Login with an admin account.
- Visit `/login` while authenticated and confirm redirect to `/`.
- Logout or clear session and confirm protected data is no longer visible.

## Core workflows

- Dashboard loads KPIs without console errors.
- Viajes list loads from Supabase.
- Create a new viaje with required fields.
- Create a conductor and confirm it appears in the list.
- Create a usuario or empresa and confirm it appears in the list.
- Update a document status and confirm the value persists after refresh.
- Update a payment/gasto status and confirm the value persists after refresh.
- Open report tabs and confirm charts/tables load for each period.

## Safety checks

- Empty tables show empty states and do not auto-insert seed/demo rows.
- Supabase errors show a visible error state or are logged for operations.
- No service-role secret is present in browser-exposed environment variables.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass locally.
