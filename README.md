# DonateTrack — NGO Donation Box Collection System

A complete frontend for managing NGO donation box collections built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.

## Quick Start

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

## Roles

### Admin
Full management access to all boxes, collectors, assignments, and reports.

### Collector
Field worker who collects donations from assigned boxes, logs expenses, and reports issues.

## Routes

| Route | Role | Description |
|-------|------|-------------|
| `/login` | — | Role selector login page |
| `/admin/dashboard` | Admin | Stats, charts, recent activity |
| `/admin/boxes` | Admin | Manage donation boxes, QR codes |
| `/admin/collectors` | Admin | Manage collector profiles |
| `/admin/assignments` | Admin | Assign boxes to collectors |
| `/admin/reports` | Admin | Collection reports with CSV export |
| `/collector/dashboard` | Collector | Collect, track progress, expenses, issues |

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Recharts (charts)
- qrcode.react (QR generation)
- Lucide React (icons)
- Framer Motion (animations)
- date-fns (date formatting)

## Mock Data

All data is stored in-memory via Zustand. Includes 15 boxes, 3 collectors, 20 collections, and more.
