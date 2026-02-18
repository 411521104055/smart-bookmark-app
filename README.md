# Smart Bookmark App

A simple, user-specific bookmark manager built with **Next.js**, **Supabase**, and **Tailwind CSS**, deployed on **Vercel**.

---

## Live Demo

[Smart Bookmark App Live](https://smart-bookmark-app-six-green.vercel.app/)

---

## GitHub Repository

[Smart Bookmark App Repo](https://github.com/411521104055/smart-bookmark-app)

---

## Tech Stack

- **Frontend:** Next.js (App Router) + Tailwind CSS  
- **Authentication & Database:** Supabase (Auth, Database, Realtime)  
- **Hosting:** Vercel  

---

## Features Implemented

1. **Google OAuth Login**  
   - Users can sign in using only Google (no email/password required).  

2. **Add Bookmark**  
   - Logged-in users can add a bookmark with a title and URL.  

3. **User-Specific Bookmarks**  
   - Bookmarks are private. User A cannot see User B's bookmarks.  
   - Implemented via Supabase Row-Level Security (RLS) policies.

4. **Real-time Updates**  
   - Bookmark list updates automatically across tabs without refresh.  
   - Fallback polling is included if WebSocket fails.

5. **Delete Bookmark**  
   - Users can delete only their own bookmarks.

6. **Deployed on Vercel**  
   - Live URL available for testing login and CRUD features.

---

## Challenges & Solutions

- **Supabase RLS Policies:**  
  - Needed to ensure each user only sees their own bookmarks.  
  - Solution: Enabled RLS and created `SELECT`, `INSERT`, `DELETE` policies using `auth.uid()`.

- **Realtime WebSocket Errors:**  
  - WebSocket sometimes failed in deployment environment.  
  - Solution: Added fallback polling every 2 seconds to ensure data consistency.

- **Next.js Prerender Errors on Vercel:**  
  - `supabaseUrl` missing during build.  
  - Solution: Added `export const dynamic = "force-dynamic";` in `page.tsx` and ensured environment variables are set in Vercel.

- **GitHub & Vercel Authentication Issues:**  
  - Initially pushing with wrong GitHub account caused permission errors.  
  - Solution: Created SSH key, added it to GitHub, switched remote URL to SSH, and successfully deployed.

---

## Installation / Local Setup

1. **Clone the repository**  
   ```bash
   git clone git@github.com:411521104055/smart-bookmark-app.git
   cd smart-bookmark-app
2. **Install dependencies**
    npm install
3. **Create a .env.local file in the root**
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
4.  **Run Locally**
     npm run dev
     Open http://localhost:3000 to see the app.
