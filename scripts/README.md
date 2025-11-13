# Scripts Directory

## seed-production.ts

This script populates your production database with all competitions and scratch card images from development.

### Quick Start

```bash
npm run seed:production
```

This will automatically seed your production database with:
- 10 complete competitions (instant, spin, scratch)
- 20 scratch card landmark images
- Proper display ordering

### Full Instructions

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for complete setup guide.

## What This Does

- ✅ Creates all competitions with descriptions, images, and prize data
- ✅ Sets up all scratch card images with proper weights
- ✅ Uses production DATABASE_URL from environment
- ✅ Safe to run multiple times (uses UPSERT logic)
- ❌ Does NOT transfer user accounts or transaction history (by design)

## After Seeding

1. Create an admin user via `/register` on your production site
2. Update the user's `is_admin` field to `true` in the database
3. Access admin panel at `/admin`

That's it! Your production site will now show all competitions.
