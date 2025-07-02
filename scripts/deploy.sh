#!/bin/bash

# Deployment Script for BuilderApp
echo "🚀 Starting deployment process..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your environment variables"
    echo "See DEPLOYMENT.md for required variables"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Git working directory is not clean"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed!"
    exit 1
fi

echo "✅ Database migrations completed!"

# Push to git (if deploying to Vercel/Railway)
echo "📤 Pushing to git..."
git push

echo "🎉 Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. Check your deployment platform dashboard"
echo "2. Verify environment variables are set"
echo "3. Test the application functionality"
echo "4. Check database connection" 