# 🚀 Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- A PostgreSQL database (Vercel Postgres, Supabase, or Railway)
- Environment variables configured
- Domain name (optional)

## Environment Variables Required

Create a `.env.local` file with these variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (for password reset, etc.)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# File Upload (if using cloud storage)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"

# AI Services (if using)
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

## Option 1: Vercel (Recommended)

### Step 1: Database Setup
1. **Vercel Postgres** (Easiest):
   - Go to Vercel Dashboard → Storage → Create Database
   - Choose PostgreSQL
   - Copy the connection string

2. **Supabase** (Alternative):
   - Create account at supabase.com
   - Create new project
   - Go to Settings → Database → Connection string

### Step 2: Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables in Vercel dashboard
6. Deploy!

### Step 3: Database Migration
After deployment, run database migrations:
```bash
# In Vercel dashboard or locally
npx prisma db push
# or
npx prisma migrate deploy
```

## Option 2: Railway

### Step 1: Setup
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Add GitHub repository

### Step 2: Environment Variables
Add all environment variables in Railway dashboard

### Step 3: Deploy
Railway will automatically deploy on git push

## Option 3: Netlify

### Step 1: Build Settings
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 18.x

### Step 2: Environment Variables
Add all required environment variables in Netlify dashboard

### Step 3: Deploy
Connect your GitHub repository and deploy

## Option 4: DigitalOcean App Platform

### Step 1: Create App
1. Go to DigitalOcean App Platform
2. Connect GitHub repository
3. Choose Node.js environment

### Step 2: Configure
- Build command: `npm run build`
- Run command: `npm start`
- Add environment variables

## Database Setup

### PostgreSQL Options:
1. **Vercel Postgres** - $20/month, easy integration
2. **Supabase** - Free tier available
3. **Railway** - $5/month
4. **Neon** - Free tier available
5. **PlanetScale** - Free tier available

### Migration Commands:
```bash
# Generate migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy

# Push schema changes (development)
npx prisma db push
```

## File Upload Setup

For file uploads, consider:
1. **Vercel Blob** - Easy integration with Vercel
2. **AWS S3** - Scalable and reliable
3. **Cloudinary** - Image optimization included
4. **UploadThing** - Modern file upload service

## Email Setup

For password reset emails:
1. **Gmail SMTP** - Free, requires app password
2. **SendGrid** - 100 emails/day free
3. **Resend** - 100 emails/day free
4. **Postmark** - Reliable delivery

## Custom Domain

1. Buy domain from Namecheap, GoDaddy, etc.
2. Add domain in your hosting platform
3. Configure DNS records
4. Update NEXTAUTH_URL environment variable

## SSL Certificate

Most platforms (Vercel, Railway, Netlify) provide automatic SSL certificates.

## Monitoring & Analytics

Consider adding:
- **Vercel Analytics** - Built-in with Vercel
- **Sentry** - Error tracking
- **Google Analytics** - User analytics
- **Uptime Robot** - Uptime monitoring

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Email functionality tested
- [ ] File upload working
- [ ] Authentication working
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Error monitoring set up
- [ ] Performance monitoring active

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Ensure database is accessible from deployment region

2. **Build Failures**
   - Check Node.js version compatibility
   - Review build logs for missing dependencies

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set

4. **File Upload Issues**
   - Verify cloud storage credentials
   - Check file size limits

## Support

For deployment issues:
- Check platform-specific documentation
- Review build logs
- Test locally with production environment variables 