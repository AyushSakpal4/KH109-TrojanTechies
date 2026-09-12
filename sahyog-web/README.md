# Sahyog Admin Panel

React admin UI for the Sahyog Disaster Response backend. Uses **Clerk** for auth, **Redux** for client state, and **React Query** for server state.

## Setup

1. **Install and run the backend** (from project root):
   ```bash
   cd .. && npm start
   ```
   Backend should run on `http://localhost:3000`.

2. **Copy env and add Clerk key**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `VITE_CLERK_PUBLISHABLE_KEY` to your Clerk **Publishable** key (same app as the backend).  
   Leave `VITE_API_URL` unset in dev so the Vite proxy is used.

3. **Install and run the admin panel**:
   ```bash
   npm install
   npm run dev
   ```
   App runs at `http://localhost:5174`. Sign in with Clerk; the app sends the Clerk session token to the backend on every API call.

**If you see "Choose organization" after sign-in:** Either select an organization (or create one) and then refresh the app, or turn off Organizations in [Clerk Dashboard](https://dashboard.clerk.com) → Configure → Organizations so sign-in goes straight to the app.

## Tech

- **Auth:** Clerk (React). Backend validates the same Clerk token.
- **State:** Redux (profile, UI) + React Query (API data, cache, mutations).
- **Routing:** React Router; protected routes require sign-in.

## Features

- **Dashboard** – Current user profile from `/api/users/me`.
- **SOS Reports** – List and update status (pending → in_progress → resolved/cancelled).
- **Disasters** – List disasters.
- **Volunteers** – List (admin only on backend).
- **Shelters** – List shelters.
- **Missing Persons** – List missing person reports.

Role-based access is enforced by the backend; the UI shows data according to your Clerk role (`org:user`, `org:volunteer`, `org:admin`, etc.).
