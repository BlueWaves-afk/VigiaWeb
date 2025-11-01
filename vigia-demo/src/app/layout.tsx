import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VIGIA",
  description: "Real-time Sonic Intelligence on the edge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* No TopBar here */}
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}