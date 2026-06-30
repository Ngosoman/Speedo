# Speedo Booking Platform (Supabase)

This project is a React + Vite app with a client portal and admin panel backed by Supabase.

Implemented features:

- Client submits booking form for admin approval.
- Return date is auto-calculated from pickup date + number of days.
- Client records are saved with sequential client code starting at `001`.
- Admin can view, edit, approve, and reject bookings.
- Admin can upload cars (including photo), assign owner, and edit daily prices.
- Admin can manage owner records.
- Admin can view client list and statuses.
- Admin can flag/blacklist by recording damage cost and notes for client + car.
- On booking approval, two contract records are generated:
	- admin-client
	- admin-owner

## 1) Configure Supabase

1. Create a Supabase project.
2. Run SQL in [supabase/schema.sql](supabase/schema.sql) in the SQL editor.
3. Copy [.env.example](.env.example) to `.env.local` and set values:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

4. Restart the dev server after adding env values.

## 2) Run project

```bash
npm install
npm run dev
```

## 3) Supabase notes

- A public storage bucket named `cars` is required for photo uploads.
- If bucket creation fails in SQL due to permissions, create it manually in Supabase Storage:
	- Bucket name: `cars`
	- Public bucket: enabled

## 4) Suggested next steps

- Add Supabase Auth and role-based access (admin/client/owner login).
- Add Row Level Security (RLS) policies per role.
- Generate downloadable PDF contracts.
- Add server-side function for guaranteed client sequence under high concurrency.
