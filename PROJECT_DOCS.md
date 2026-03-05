# ቅዱሳን Mezmur — Project Documentation

This is a living document detailing the architecture, tech stack, and implementation phases of the **ቅዱሳን Mezmur** Ethiopian Orthodox Tewahedo Hymns application.

---

## 🛠 Tech Stack & Architecture

### Core Frameworks

- **Framework**: Next.js 15 (App Router, Server Actions, Server/Client Components)
- **Language**: TypeScript (Strict mode)
- **Styling**: Vanilla CSS (CSS Modules & Global Variables) — **No Tailwind**

### Data & Backend

- **Database**: PostgreSQL (hosted on Neon Serverless Postgres)
- **ORM**: Prisma Client
- **Authentication**: Better Auth (`@better-auth/next-js`, Prisma Adapter)
  - _Modes_: Email/Password & Google OAuth
- **Full-Text Search**: Native PostgreSQL `to_tsvector` with the `'simple'` dictionary (crucial for Amharic/Ge'ez text support)

### Audio & State

- **Audio Engine**: YouTube Iframe API (Headless/Hidden player)
- **Global State Management**: Zustand (`usePlayerStore` for persistent audio playback across routes)
- **Data Fetching**: React Server Components (RSC) & Server Actions (Zero explicit client-side `fetch` for DB reads)

---

## 🎨 Design System (Ethiopian Aesthetics)

The application utilizes a custom design system built entirely from scratch with raw CSS, inspired by Ethiopian Orthodox tradition:

- **Holy Parchment (`--color-bg`)**: `#FDFBF7` (The color of ancient Branna/parchment manuscripts)
- **Marian Blue (`--color-accent`)**: `#1B4282` (Deep, reverent blue representing St. Mary)
- **Fidäl Typography (`--font-ethiopic`)**: Native system fonts optimized for Amharic (`Nyala`, `Kefa`, `Abyssinica SIL`)
- **Modern Flourishes**: Glassmorphism sidebars, sub-pixel borders, and subtle CSS transition animations.

---

## ✅ Completed Phases (1–4)

### Phase 1: Foundation & App Shell

**Goal**: Establish the overarching layout, styling foundations, and database connection.

- [x] Initialized Next.js 15 project with TypeScript and ESLint.
- [x] Set up Neon Postgres DB and Prisma schema (Models: `Category`, `SubCategory`, `Zemari`, `Mezmur`).
- [x] Seeded the database with 1,272 real Mezmurs, lyrics, and subcategories from a JSON dataset.
- [x] Created the global CSS design system (Parchment & Marian Blue theme).
- [x] Built the `AppShell`, persistent `Sidebar`, and mobile Hamburger navigation.
- [x] Generated the `HomePage` with dynamic category cards and emoji mappings.

### Phase 2: Core Data Views (Navigation & Reading)

**Goal**: Allow users to browse categories, read lyrics, and view individual Mezmur details.

- [x] Implemented `/categories/[slug]` route with pagination (50 items per page).
- [x] Built the `MezmurRow` component for list views.
- [x] Created the `/mezmurs/[id]` detail page to cleanly display Amharic lyrics, preserving line breaks and stanzas.
- [x] Implemented the `/categories` (Browse All) index page displaying a grid of all categories and mezmur counts.
- [x] Handled dynamic routing and `encodeURIComponent` for Amharic slugs.

### Phase 3: The Persistent Audio Engine

**Goal**: A Spotify-like global audio player that streams YouTube audio while navigating the app seamlessly.

- [x] Set up Zustand `playerStore` to manage track queue, current status, volume, and playback state.
- [x] Built the `<GlobalAudioPlayer />` component leveraging the YouTube Iframe API (`window.YT`).
- [x] Fixed complex DOM race conditions related to React lifecycle and YouTube iframe insertion.
- [x] Implemented a `queue` system so users can click "Next" or "Previous" to linearly play through a category.
- [x] Added Global Keyboard Shortcuts (Space to play/pause, M to mute, N/P for next/prev, Arrow keys for 10s seek).
- [x] Created the visual `PlayerBar` UI sticky at the bottom of the screen.

### Phase 4: Identity, Personalization & Search

**Goal**: Allow users to log in, save favorites, track history, and search the Amharic library phonetically.

- [x] **Authentication**: Integrated Better Auth with Prisma and Neon. Configured Google OAuth and custom Email/Password registration. Built the `/auth` UI page.
- [x] **Favorites System**: Created the `Favorite` DB model. Implemented Server Actions to toggle hearts securely. Built the `/favorites` protected route. Added Optimistic UI to the heart buttons so they react instantly on click.
- [x] **Phonetic Search**: Built a custom `amharic-transliterate.ts` parser that converts Latin alphabet input (e.g., "selam") directly to Ge'ez/Fidäl script ("ሰላም").
- [x] **Postgres Full-Text Search**: Built `/api/search` route using `to_tsvector('simple')` prioritizing title and lyric matches.
- [x] **Real-time Search UI**: Created the `/search` page with 300ms debouncing, live Latin-to-Amharic preview, lyric snippet highlighting, and a global `Ctrl+K` shortcut.
- [x] **Listening History**: Created the `ListenHistory` DB model using upserts (to prevent duplicates, only updating `playedAt`). Automatically logs listens in the background when tracks start. Integrated a "Recently Played" horizontal tracker to the Home page.

---

## 🚀 Completed Phases (1–5)

### Phase 5: Admin Panel & Content Management

**Goal**: A protected internal dashboard to manage the 1,272+ mezmur dataset.

- [x] **Role-Based Access Control**: Prisma DB fields supporting `USER`, `EDITOR`, and `SUPER_ADMIN`. Protected Dashboard routes.
- [x] **Dashboard Overview**: Metrics overview of Total Mezmurs, Total Users, missing YouTube URLs and Recent active listening data. Includes a coverage progress bar.
- [x] **Mezmur Data Table**: A highly functional table allowing Editors to natively inline edit YouTube URLs and search/filter.
- [x] **Category Management**: Edit Amharic naming and Latin transliterations using inline editing and subcategory dropdowns.
- [x] **User Management**: SUPER_ADMIN interface to manage, view info, and instantly promote users to EDITOR.
- [x] **Audit Logging**: Robust backend tracking keeping explicit logs on DB mutation tasks.

---

## 🔮 Upcoming Phases

_(This document will be updated dynamically as future requirements are planned)._
