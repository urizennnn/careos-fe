import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareOS — AI Hospital Operating System",
  description: "AI-powered hospital management platform for Nigerian healthcare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
