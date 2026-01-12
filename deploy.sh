#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# Configuration
PROJECT_DIR="/home/ubuntu/web/svelte-calendar" 

# Load environment (NVM, PM2, etc.)
# This ensures that non-interactive shells have access to the correct Node version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # Load nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # Load nvm bash_completion

# If using zsh, you can also source .zshrc but NVM is usually the key
# source ~/.zshrc

echo "🚀 Starting deployment..."
cd $PROJECT_DIR

echo "📥 Pulling latest changes from main..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building project..."
npm run build

echo "🔄 Restarting application with PM2..."
pm2 restart svelte-calendar || pm2 start build/index.js --name svelte-calendar --node-args="-r dotenv/config"

echo "✅ Deployment finished successfully!"
