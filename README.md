# 311.2 Brampton

A community-driven neighborhood issue reporting platform for Brampton, Ontario. Residents report local issues (potholes, broken streetlights, graffiti, etc.) with geo-tagged photos and videos, and city officials use the admin dashboard to prioritize and resolve them based on community upvotes.

Built for **ThunderHacks II**.

## Features

**Mobile App (Resident-facing)**
- Report issues with photos, videos, and GPS location
- Interactive map with clustered pins within Brampton
- TikTok-style media feed with upvoting and comments
- Anonymous Reddit-style usernames
- Category filtering (pothole, streetlight, graffiti, garbage, and more)

**Web Dashboard (Admin-facing)**
- Overview analytics with charts and stats
- Filter and sort reports by category, status, date, and upvotes
- Interactive map with marker clustering
- Status updates (Open → In Progress → Resolved) with required comments and optional image attachments
- Light/dark mode

## User Flow

### Resident (Mobile App)

```
Sign Up / Log In
       ↓
   Home Feed ← Browse reports, upvote, comment
       ↓
  Tap "+" to Report
       ↓
  Select Category (pothole, streetlight, graffiti, etc.)
       ↓
  Take Photo / Video → Auto-detect GPS location
       ↓
  Add Title & Description → Submit
       ↓
  Report appears on Map & Feed
       ↓
  Community upvotes & comments push it higher
       ↓
  Receive status updates (In Progress → Resolved)
```

### City Official / Mayor (Web Dashboard)

```
Log In (admin credentials)
       ↓
  Dashboard Overview → See stats, charts, category breakdown
       ↓
  Browse Reports → Filter by category, status, date, upvotes
       ↓
  Click Report → View details, media, location, comments
       ↓
  Change Status to "In Progress"
       ↓
  Leave a comment explaining the action + optional image
       ↓
  Comment appears as pinned status update for residents
       ↓
  Mark as "Resolved" with a closing comment when fixed
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 51, React Native, TypeScript |
| Web Dashboard | Vite, React 18, TypeScript, Tailwind CSS |
| Maps | Leaflet, react-leaflet, marker clustering |
| Charts | Recharts |
| Backend | Firebase (Auth, Firestore, Storage) |
| Deployment | Vercel (web), Expo (mobile) |

## Project Structure

```
├── mobile/          # Expo/React Native resident app
├── web/             # Vite/React admin dashboard
├── firebase/        # Firestore & Storage security rules
└── shared/          # Shared TypeScript types and geo utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project

### Mobile App

```bash
cd mobile
cp .env.example .env        # Fill in your Firebase config
npm install
npm start
```

### Web Dashboard

```bash
cd web
cp .env.example .env        # Fill in your Firebase config
npm install
npm run dev
```

### Environment Variables

Both apps require Firebase configuration via environment variables. See `.env.example` in each directory:

- **Web**: `VITE_FIREBASE_*` variables
- **Mobile**: `EXPO_PUBLIC_FIREBASE_*` variables

## Deployment

The web dashboard is deployed on **Vercel** with automatic deploys from the `main` branch. The root directory is set to `web/`.

## Team

Built with care for the Brampton community.
