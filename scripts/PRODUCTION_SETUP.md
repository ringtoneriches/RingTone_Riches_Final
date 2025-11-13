# 🚀 Production Database Setup Guide

This guide will help you populate your production database with all competitions and data from development.

## Quick Setup (Recommended)

### Step 1: Get Your Production Database URL

1. Go to your Replit project
2. Click on the **"Secrets"** tab (🔒 icon on the left sidebar)
3. Look for `DATABASE_URL` - this is your **production** database connection string
4. Copy this URL (it should start with `postgresql://` or `postgres://`)

### Step 2: Run the Seeding Script

Open the **Shell** tab in your Replit project and run:

```bash
npm run seed:production
```

This script will automatically:
- ✅ Create all 10 competitions from development
- ✅ Create all 20 scratch card images  
- ✅ Set proper display orders
- ✅ Use the production DATABASE_URL from your secrets

### Step 3: Create Your Admin User

Since user data is NOT transferred (for security reasons), you'll need to create a new admin account:

1. Visit your deployed production site
2. Go to `/register` and create a new account
3. Open the Shell and run this SQL command to make yourself an admin:

```bash
# Replace 'your-email@example.com' with your actual email
npm run seed:production
```

Or manually update in the database pane:
- Navigate to the **Database** tab
- Find your user in the `users` table
- Set `is_admin` to `true`

## What Gets Seeded?

### ✅ Competitions (10 total):
1. **£1,000 TUI Holiday Voucher** - 99p per entry
2. **£1,000 Tax-Free Cash** - 99p per entry  
3. **Scratch & Win** - £2.00 per play
4. **Spin the Wheel** - £2.00 per spin
5. **Lux Excite Sink** - 40p per entry
6. **£500 Smyths Toys Gift Card** - 50p per entry
7. **£500 Amazon Gift Card** - 50p per entry
8. **PlayStation 5 Pro Digital Edition** - 50p per entry
9. **£500 JD Sports Gift Card** - 50p per entry
10. **£500 Free Giveaway** - FREE entry
11. **Orange iPhone 17 Pro Max** - 75p per entry

### ✅ Scratch Card Images (20 famous landmarks):
- Barrier Reef, Angel of the North, Big Ben, Buckingham Palace
- Burj Khalifa, Colosseum, Eiffel Tower, Empire State Building
- Golden Gate Bridge, Grand Canyon, Great Wall of China
- Mount Everest, Notre Dame, Pyramids of Pisa, Statue of Liberty
- Stonehenge, Taj Mahal, Times Square, Tower Bridge, Tower of Pisa

### ❌ What Does NOT Get Transferred:
- User accounts (for security)
- Orders and transactions
- Tickets and winners
- Payment history

## Troubleshooting

### Problem: "Command not found: tsx"
**Solution:** The seeding script uses the production DATABASE_URL automatically. Just run:
```bash
npm run seed:production
```

### Problem: "Cannot find DATABASE_URL"
**Solution:** Make sure your production DATABASE_URL secret is set in the Secrets tab.

### Problem: "Competitions still not showing"
**Solution:**
1. Verify the script ran successfully (look for ✅ success messages)
2. Hard refresh your production site (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the production database in the Database tab to confirm data was inserted

### Problem: "Permission denied on production database"
**Solution:** Make sure you're using the correct DATABASE_URL from your Secrets tab, not the development database URL.

## Verify Everything Works

After seeding, visit your production site:

1. **Homepage**: Should show all competitions
2. **Spin Wheel**: Should work with configured segments  
3. **Scratch Card**: Should show all 20 landmark images
4. **Admin Panel** (after creating admin user):
   - `/admin/competitions` - View all instant competitions
   - `/admin/spin-wheel` - View spin wheel setup
   - `/admin/scratch-card` - View scratch card setup

## Need Help?

If you encounter any issues:
1. Check the Shell output for error messages
2. Verify your DATABASE_URL is correct in Secrets
3. Make sure the production database is running
4. Try running the script again - it's safe to run multiple times (uses UPSERT)

---

**🎉 That's it! Your production database is now populated and ready for users!**
