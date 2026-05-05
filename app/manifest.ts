import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نظام إدارة العيادة",
    short_name: "عيادتي",
    description: "نظام متكامل لإدارة المواعيد والمرضى في عيادتك",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0C1F3F",
    theme_color: "#0C1F3F",
    lang: "ar",
    dir: "rtl",
    categories: ["medical", "productivity", "business"],
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
