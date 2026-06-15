import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Journey",
  description:
    "A personal fitness, nutrition, health, and performance operating system.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "My Journey",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
