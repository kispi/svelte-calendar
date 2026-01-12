#!/bin/bash

# Configuration
# Note: Update PROJECT_DIR if your project is in a different path on the server
PROJECT_DIR="/home/ubuntu/web/svelte-calendar" 

echo "🚀 Starting deployment..."

cd $PROJECT_DIR || { echo "❌ Project directory not found"; exit 1; }

echo "📥 Pulling latest changes from main..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building project..."
npm run build

echo "🔄 Restarting application with PM2..."
pm2 restart svelte-calendar || pm2 start build/index.js --name svelte-calendar --node-args="-r dotenv/config"

echo "✅ Deployment finished successfully!"
