# C-Presence: Digital Attendance System

C-Presence is a modern, integrated digital attendance (presence) system built with **Next.js** and **Supabase**. It is designed for employees and administrators (specifically tailored for KAI Commuter Indonesia branding) to manage presence, documents, and statistics efficiently.

## Features

### Employee / User Module (`/users`)
- **Dashboard**: Real-time attendance summary (Clock-in, Clock-out, Duration).
- **Presence**: Location-based attendance logging.
- **Time Management**: View schedules and work history.
- **Documents**: Access and download official reports and documents.
- **Statistics**: Personal performance analytics.
- **Mobile-First**: Optimized for mobile usage with a bottom navigation layout.

### Admin Module (`/admin`)
- **Admin Dashboard**: Real-time monitoring of all employee activities.
- **Master Data**: Manage employees, positions, and core organization data.
- **Approvals**: Review and approve employee requests/documents.
- **Analytics**: Company-wide statistics and trends.
- **Role-Based Access**: Secure login exclusively for system administrators.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **State Management**: React Hooks
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps**: [Pigeon Maps](https://pigeon-maps.js.org/)

---

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd c-presence
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```text
├── app/
│   ├── admin/       # Administrator pages and layout
│   ├── users/       # Employee pages and mobile-first design
│   └── layout.tsx   # Root layout
├── components/      # Shared UI components (Modals, Navs, etc.)
├── lib/             # Utilities and Supabase client configuration
├── public/          # Static assets and images
└── tailwind.config.ts
```

---

## Design Philosophy

This project follows the **KAI Commuter** brand identity, utilizing a bold Red (`#E62020`) and White color palette. The UI focuses on clean, card-based layouts with modern typography and smooth interactions.
