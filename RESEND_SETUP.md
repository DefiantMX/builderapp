# Resend Email Setup Guide

## Step 1: Create a Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your API Key
1. In your Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name (e.g., "Builder App")
4. Copy the API key (starts with `re_`)

## Step 3: Add Environment Variables
Add these to your `.env.local` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_BASE_URL=https://your-app-domain.vercel.app
```

## Step 4: Verify Your Domain (Optional but Recommended)
1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `yourdomain.com`)
3. Follow the DNS verification steps
4. Once verified, update `FROM_EMAIL` to use your domain

## Step 5: Test the Email
1. Send an invite to a team member
2. Check if the email is received
3. Verify the invite link works

## Troubleshooting
- **Email not sending**: Check your API key and domain verification
- **Spam folder**: Make sure your domain is verified in Resend
- **Development**: For local testing, you can use a verified domain or Resend's test domain

## Free Tier Limits
- 3,000 emails per month
- 100 emails per day
- Perfect for most small to medium teams

## Security Notes
- Never commit your API key to version control
- Use environment variables in production
- Consider domain verification for better deliverability 