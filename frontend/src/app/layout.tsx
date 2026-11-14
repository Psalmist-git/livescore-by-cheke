import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import StartupSplash from "@/components/StartupSplash";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LiveScore by Cheke",
    template: "%s | LiveScore by Cheke",
  },

  description:
    "LiveScore by Cheke brings you live sports scores, match fixtures, results, league standings, team information and match updates from around the world.",

  applicationName: "LiveScore by Cheke",

  keywords: [
    "LiveScore",
    "Live sports scores",
    "Football fixtures",
    "Football results",
    "League standings",
    "Sports teams",
    "LiveScore by Cheke",
  ],

  authors: [
    {
      name: "LiveScore by Cheke",
    },
  ],

  icons: {
    icon: "/brand/livescore-icon.svg",
    shortcut: "/brand/livescore-icon.svg",
    apple: "/brand/livescore-icon.svg",
  },

  openGraph: {
    title: "LiveScore by Cheke",
    description:
      "Every sport. Every moment. Follow live scores, fixtures and competitions.",
    siteName: "LiveScore by Cheke",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <StartupSplash />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
