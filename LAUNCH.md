# Trading Research Dashboard — Launch Guide

## Prerequisites (one-time)
```bash
brew install node
npm install -g vercel
```

## Run locally
```bash
cd ~/trading-dashboard
npm install
npm run dev
```
Then open http://localhost:5173 in your browser.

## Deploy to Vercel
```bash
cd ~/trading-dashboard
npm run build
vercel --prod
```
Vercel will give you a live URL like: https://trading-dashboard-xyz.vercel.app

## Install as PWA on iPhone
1. Open the Vercel URL in Safari
2. Tap the Share button → "Add to Home Screen"
3. Tap Add — it installs as a full-screen app

## Install as PWA on Desktop (Chrome/Edge)
1. Open the Vercel URL
2. Click the install icon in the address bar (or menu → "Install Trading Research Dashboard")

## Enable push notifications
1. Open the app → Settings tab
2. Tap "Enable Push Notifications" → Allow
3. You'll receive browser notifications for all configured alerts

## What's live vs mock data
- Prices: Live from Finnhub (refreshes every 90 seconds)
- News: Live from Finnhub (fetched on load)
- BTC price: Live from Alpha Vantage
- Sentiment: Live from StockTwits (refreshes every 10 minutes)
- Sparklines: Live data points accumulated during your session
- Signal history: Seeded with demo data; new signals added by the scheduled monitor
- Morning Brief archive: Seeded with July 2 demo brief; new ones saved when you run "morning brief"

## API key locations
Settings page → API Keys section (stored locally, never sent to any server except Finnhub/AV)
