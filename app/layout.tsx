import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Geist } from "next/font/google";
import "./globals.css";
import RegisterSW from "./components/RegisterSW";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "الهلال الذهبي — نظام إدارة العيادات والصيدليات والمختبرات",
  description: "نظام متكامل لإدارة العيادات والصيدليات والمختبرات",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "الهلال الذهبي",
  },
  verification: {
    google: "kaJq6Uri2UG16KiQPnlgnviCwnzz-8myJlKaXIdLMfE",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E2440",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cn("h-full", plexArabic.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-ink antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
