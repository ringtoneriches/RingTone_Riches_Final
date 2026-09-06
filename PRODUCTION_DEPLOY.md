# Production Deployment Guide

Your Ringtone Riches platform supports optional automatic database seeding and a secure admin bootstrap on first deploy.

## What Can Happen Automatically

When you deploy to production, the system may:

1. Check if your production database is empty
2. Seed competitions and scratch card images (only if auto-seed is enabled)
3. Create the **first** admin account — **only** when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and no admin exists yet

---

## How to Deploy

### Step 1: Set required environment variables

In your hosting provider (Railway, Replit Secrets, etc.), configure at minimum:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session signing secret |
| `ADMIN_EMAIL` | For first admin | Email for initial admin (first deploy only) |
| `ADMIN_PASSWORD` | For first admin | Strong password (min 12 characters) |

**Important:** Do not commit admin credentials to git. Set them only in your deployment environment.

### Step 2: Deploy the application

Deploy using your normal process (`npm run build` + `npm start`, or your host's deploy button).

On first startup with no existing admin, you should see:

```
ℹ️  Admin bootstrap skipped ...
```

or, when env vars are set and no admin exists:

```
✅ Initial admin created for your@email.com
```

### Step 3: Log in to the admin panel

Visit `https://your-site.com/admin/login` and sign in with the credentials from your environment variables.

Change the password after first login if your host allows updating `ADMIN_PASSWORD` — the bootstrap only runs once.

---

## Creating an Admin Manually (Alternative)

If you prefer not to use boot-time bootstrap, run this once against your production database:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-secure-password-min-12-chars' npm run create-admin
```

Requirements:

- `DATABASE_URL` must be set
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` (min 12 chars) must be set
- The email must not already exist as a non-admin user

---

## Re-deploying

- Existing data is preserved
- Admin bootstrap **does not run again** once any admin account exists
- Competitions and users are not overwritten on redeploy

---

## Auto-seed (Optional)

Competition/scratch seeding via `autoSeedProduction()` is **disabled by default** in `server/index.ts`. Enable only for intentional empty-database setups.

To seed manually:

```bash
npm run seed:production
```

See `scripts/PRODUCTION_SETUP.md` for details.
