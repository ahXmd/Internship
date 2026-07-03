import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "ProFlow – Project Management",
  description: "Professional project management tool to track tasks, deadlines and team progress.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
