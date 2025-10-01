import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Dashboard - Construction & Real Estate",
  description: "View and manage your construction and real estate leads",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}

