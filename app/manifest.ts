import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "الهلال الذهبي",
    short_name: "الهلال الذهبي",
    description: "نظام متكامل لإدارة العيادات والصيدليات والمختبرات",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0C1F3F",
    theme_color: "#0C1F3F",
    lang: "ar",
    dir: "rtl",
    categories: ["medical", "productivity", "business"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
