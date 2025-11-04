import "./globals.css";
import type { Metadata } from "next";


export const metadata = {
  title: "VIGIA",
  description: "Road-hazard intelligence & dePIN economy.",
  icons: {
    // Modern browsers support SVG favicons
    icon: [{ url: "/brand/vigia-logo.svg", type: "image/svg+xml" }],
    // Safari pinned-tab (monochrome)—using same SVG is ok if it’s single color;
    // otherwise omit this line or provide a one-color version later.
    other: [{ rel: "mask-icon", url: "/brand/vigia-logo.svg", color: "#0ea5e9" }],
  },
  openGraph: {
    title: "VIGIA",
    description: "Road-hazard intelligence & dePIN economy.",
    // If you don’t have a 1200×630 PNG yet, you can add it later.
    // images: [{ url: "/og-vigia.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIGIA",
    description: "Road-hazard intelligence & dePIN economy.",
    // images: ["/og-vigia.png"],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* No TopBar here */}
      <body className="bg-slate-950 text-white antialiased">{children}</body>
      
      
    </html>
  );
}