import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Timebox",
  description: "Minimal timeboxing PWA",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#0f172a"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
