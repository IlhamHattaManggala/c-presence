import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: settings } = await supabase.from('settings').select('*');
  
  const siteName = settings?.find(s => s.key === 'site_name')?.value || 'C Presence';
  const description = settings?.find(s => s.key === 'description')?.value || 'Sistem Manajemen Kehadiran Pegawai PT KAI Commuter';
  const favicon = settings?.find(s => s.key === 'favicon_url')?.value || '/favicon.ico';

  return {
    title: siteName,
    description: description,
    icons: {
      icon: favicon,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
