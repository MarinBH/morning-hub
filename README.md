# Morning Hub 🌅

Your daily command center — calendar, tasks, morning practice, and voice capture in one mobile-first PWA.

## Quick Deploy to Vercel

### 1. Push to GitHub
```bash
cd morning-hub-app
git init
git add .
git commit -m "Morning Hub v1"
gh repo create morning-hub --public --push --source=.
```

### 2. Deploy on Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import your `morning-hub` repo
- Add Environment Variable:
  - `TODOIST_API_TOKEN` = your token
- Deploy!

### 3. Install as PWA on Android
- Open your Vercel URL in Chrome on Android
- Tap ⋮ menu → "Add to Home Screen"
- It now opens like a native app

## Features

- **📅 Calendar** — Google Calendar integration (mock data until configured)
- **✅ Tasks** — Live Todoist with tap-to-complete
- **🌅 Practice** — Habits, breathwork timer, daily journal prompt
- **🎙️ Capture** — Voice-to-text + quick notes, routes to Todoist inbox
- **📱 PWA** — Installable, works offline for practice tab

## Google Calendar Setup (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable Google Calendar API
3. Create Service Account → Download JSON key
4. Share your calendar with the service account email
5. Add to Vercel env vars:
   - `GOOGLE_CALENDAR_CREDENTIALS` = the full JSON key
   - `GOOGLE_CALENDAR_ID` = your email
6. Add `googleapis` dependency: `npm install googleapis`
