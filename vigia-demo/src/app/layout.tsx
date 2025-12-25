import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { Inter } from "next/font/google";
import NoiseOverlay from "@/components/NoiseOverlay";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VIGIA",
  description: "Road-hazard intelligence & dePIN economy.",
  icons: {
    icon: [{ url: "/brand/vigia-logo.svg", type: "image/svg+xml" }],
    other: [{ rel: "mask-icon", url: "/brand/vigia-logo.svg", color: "#0ea5e9" }],
  },
  openGraph: {
    title: "VIGIA",
    description: "Road-hazard intelligence & dePIN economy.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIGIA",
    description: "Road-hazard intelligence & dePIN economy.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="relative bg-slate-950 text-white antialiased light:bg-slate-50 light:text-slate-900">
        {/* 🔹 GLOBAL GRAIN OVERLAY */}
        <NoiseOverlay />

        {/* 🔹 App Providers + Content */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
