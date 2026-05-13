import type { Metadata, Viewport } from "next";
import { Cairo, Geist } from "next/font/google";
import "./globals.css";
import RegisterSW from "./components/RegisterSW";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "عيادتي — نظام إدارة العيادة",
  description: "نظام متكامل لإدارة المواعيد والمرضى في عيادتك",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "عيادتي",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C1F3F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cn("h-full", cairo.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col bg-[#EEF2F9] text-[#0F172A] antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
