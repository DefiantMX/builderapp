# 🗄️ Supabase + Vercel Setup Guide

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create new organization (if prompted)

## Step 2: Create New Project

1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name**: `builderapp-db` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for setup to complete (2-3 minutes)

## Step 3: Get Database Connection String

1. In your Supabase project dashboard
2. Go to **Settings** → **Database**
3. Scroll down to "Connection string"
4. Select "URI" format
5. Copy the connection string

It will look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Important**: Replace `[YOUR-PASSWORD]` with the password you created in Step 2.

## Step 4: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the connection string from Step 3
   - **Environment**: Production (and Preview if you want)
4. Click "Save"

## Step 5: Run Database Migrations

After deploying to Vercel:

1. **Option A: Vercel CLI** (if you have it installed):
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

2. **Option B: Supabase Dashboard**:
   - Go to Supabase → SQL Editor
   - Run your Prisma migrations manually

3. **Option C: Local Migration**:
   ```bash
   # Set your production DATABASE_URL locally
   export DATABASE_URL="your-supabase-connection-string"
   npx prisma migrate deploy
   ```

## Step 6: Verify Connection

1. Deploy your app to Vercel
2. Test the application
3. Check if database operations work
4. Verify user registration/login works

## Environment Variables for Vercel

Add these to your Vercel environment variables:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here"
```

## Troubleshooting

### Connection Issues
- Verify the password in the connection string
- Check if your IP is allowed (Supabase has IP restrictions)
- Ensure the project is active

### Migration Issues
- Make sure you're using the production DATABASE_URL
- Check Prisma logs for specific errors
- Verify your schema is compatible with PostgreSQL

### Performance
- Supabase free tier has limitations
- Consider upgrading for production use
- Monitor usage in Supabase dashboard

## Next Steps

1. **Set up Row Level Security** (RLS) in Supabase if needed
2. **Configure backups** (available in paid plans)
3. **Set up monitoring** and alerts
4. **Consider connection pooling** for better performance

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs) 