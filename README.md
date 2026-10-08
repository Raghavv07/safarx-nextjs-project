# 🚗 SafarX — Next-Gen Urban Mobility & Ride-Hailing Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**SafarX** is an enterprise-grade, full-stack ride-hailing and urban freight platform inspired by Uber, Ola, and Porter. Built with Next.js 16 (Turbopack), React 19, Prisma ORM, and Supabase Postgres, it features real-time route geometry, dual-OTP safety verification, WebRTC Video KYC, driver earnings wallet & instant payouts, GST tax invoices, and animated Light/Dark modes.

---

## 🌟 Key Features

### 1. 🗺️ Rider Experience & Real-Time Navigation
- **Interactive Road Planner**: Live route geometry calculation using Leaflet & OSRM road networks with pickup/drop pins.
- **Multi-Vehicle Fleet**: Dynamic fare estimation across **Moto Fast (₹35)**, **Auto Rickshaw (₹50)**, **Mini Comfort (₹80)**, **Prime Sedan (₹120)**, and **SafarX XL SUV (₹180)** with base fare and per-km pricing models.
- **Dual OTP Security**: India-standard safety architecture — 4-digit **Pickup OTP** required to start the ride and **Drop OTP** required to complete the ride.
- **In-Ride Messaging & AI Quick Replies**: In-ride chat with AI-assisted quick suggestions powered by APInex DeepSeek Flash.
- **Trip History & GST Invoices**: Detailed ride history ledger (`/dashboard/trips`) with downloadable official SafarX GST Tax Invoices (PDF/Print).

### 2. 🛞 Driver Partner & Fleet Management
- **5-Step Onboarding Wizard**: Multi-step registration flow (`/partner/onboard`) covering personal credentials, commercial vehicle specifications, document uploads (RC, DL, Aadhaar), and bank account/UPI details.
- **Driver Duty Terminal**: Instant toggle between Online/Offline duty states with live active-ride polling and 1-click status handling.
- **Driver Wallet & Instant Payouts**: Real-time ledger (`/partner/wallet`) displaying total lifetime earnings, platform commission cuts (80/20 split), settled amounts, withdrawable balance, and instant bank/UPI withdrawal processing.

### 3. 🛡️ Admin & Compliance Officer Console
- **Role-Gated Portal**: Secure compliance portal (`/admin`) for platform administrators.
- **Driver Verification Pipeline**: Document audit table with side-by-side inspection of Driving License, RC, and Aadhaar cards with instant Approval or Rejection (with reason).
- **WebRTC Video KYC Room**: Direct integration with Stream Video SDK (`/admin/kyc`) enabling live officer-driver face and license verification.
- **Business Intelligence**: Gross platform merchandise volume (GMV), completed ride counts, active duty drivers, and net platform commission analytics.

### 4. 💳 Cashless & Cash Payment Gateway
- **Dual Payment Architecture**: Supports Cash on Drop or instant cashless settlement (Online UPI/QR/Card simulated modal).
- **Automated Financial Splits**: Real-time split calculation between driver earnings and platform commission upon trip completion.

### 5. 🎨 Design & Accessibility
- **Light & Dark Mode**: Persistent theme toggle with system sync powered by `next-themes` and `motion/react` spring micro-interactions.
- **Zero Hydration Mismatch**: Next.js 16 and React 19 compliant SSR setup.
- **Glassmorphic Aesthetic**: Ambient mesh glows, fluid card hover transitions, and mobile-first responsive layouts.

---

## 🏗️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4 (App Router, Turbopack, Server Actions) |
| **Frontend UI** | React 19.3, Tailwind CSS v4, Lucide Icons, Radix UI / Shadcn |
| **Animations** | Motion (`motion/react`) |
| **Maps & Routing** | Leaflet, OpenStreetMap Tiles, OSRM Road Geometry API |
| **Database & ORM** | Supabase Postgres, Prisma ORM 7 |
| **Video Streaming** | GetStream Video & Audio WebRTC SDK |
| **Media Storage** | ImageKit.io CDN |
| **Email Service** | Resend |
| **AI Suggestions** | APInex OpenAI-compatible API Gateway |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database (Supabase recommended)
- Git

### 2. Clone Repository
```bash
git clone https://github.com/Raghavv07/safarx-nextjs-project.git
cd safarx-nextjs-project
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the template file:
```bash
cp .env.example .env
```
Fill in your credentials in `.env`:
- `DATABASE_URL` & `DIRECT_URL` (Supabase Postgres)
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STREAM_APP_ID`, `STREAM_API_KEY` & `STREAM_API_SECRET` (GetStream.io)
- `RESEND_API_KEY` (Resend Email)
- `IMAGEKIT_PRIVATE_KEY`, `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` & `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`

### 5. Run Database Migrations & Generate Prisma Client
```bash
npx prisma db push
npx prisma generate
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
├── prisma/
│   └── schema.prisma          # Database schema (User, Vehicle, Booking, etc.)
├── src/
│   ├── actions/               # Server Actions (Auth, Bookings, Partner, Admin, Wallet)
│   ├── app/                   # App Router pages & API routes
│   │   ├── admin/             # Compliance officer portal & Video KYC room
│   │   ├── dashboard/         # Rider dashboard, booking flow & trip invoices
│   │   ├── partner/           # Driver onboarding, duty dashboard & wallet
│   │   ├── ride/[id]/         # Dedicated active ride live tracking screen
│   │   └── api/               # Payment, Stream token, Bookings & Health APIs
│   ├── components/            # Reusable UI & specialized widgets
│   │   ├── landing/           # Hero motion & vehicle simulator
│   │   ├── map/               # Leaflet live map & route rendering
│   │   ├── video/             # Stream Video KYC rooms
│   │   └── theme-toggle.tsx   # Light/Dark mode animated switcher
│   └── lib/                   # Prisma client, Supabase, Geo math, ImageKit, Resend
```

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
