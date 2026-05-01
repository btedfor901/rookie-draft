import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rookie Draft | Dynasty Fantasy Football",
  description: "Private dynasty league command center for rookie drafts and team management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-gray-100 antialiased">{children}</body>
    </html>
  );
}
