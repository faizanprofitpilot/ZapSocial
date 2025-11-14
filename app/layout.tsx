import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { PlatformMain } from "@/components/layout/PlatformMain";

export const metadata: Metadata = {
  title: "ZapSocial - AI Social Media Manager",
  description: "Generate, schedule, and publish content across all platforms with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f172a] text-foreground">
        <Navbar />
        <Sidebar />
        <PlatformMain>{children}</PlatformMain>
      </body>
    </html>
  );
}

