#!/bin/bash
# Deploy StefanOS V2 to Vercel
# Usage: ./deploy.sh [VERCEL_TOKEN]

TOKEN=${1:-$VERCEL_TOKEN}

if [ -z "$TOKEN" ]; then
    echo "Error: Vercel token required"
    echo "Usage: ./deploy.sh YOUR_VERCEL_TOKEN"
    echo "Or set VERCEL_TOKEN environment variable"
    exit 1
fi

npm install
vercel --token=$TOKEN --yes --prod
