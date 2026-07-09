import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

import { FullScreenToggle } from "@/components/FullScreenToggle";
import { Logo } from "@/components/Logo";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "X-Scrapper",
  description: "Internal lead extraction engine dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased bg-gradient-to-b from-[#0052ff] to-[#002880] text-text-frame h-screen overflow-hidden flex p-4 selection:bg-accent-primary/30`} suppressHydrationWarning>
        <Providers>
          <AuthGuard>
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-bg-canvas text-text-primary rounded-[2rem] overflow-hidden shadow-2xl ml-2 border border-border-color/50">
              <header className="h-20 border-b border-border-color/30 bg-transparent sticky top-0 z-10 px-8 flex items-center justify-between">
                <div className="text-sm font-medium text-text-secondary w-1/3">
                  Connected to Engine
                </div>
                <div className="flex-1 flex justify-center items-center">
                  <h1 className="text-3xl font-semibold tracking-wide text-text-primary flex items-center drop-shadow-sm">
                    <Logo size={50} className="" />
                    <span className="bg-clip-text">
                      SCRAPPER
                    </span>
                  </h1>
                </div>
                <div className="flex items-center justify-end gap-4 w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                    </span>
                    <span className="text-sm text-text-secondary font-medium">System Online</span>
                  </div>
                  <FullScreenToggle />
                </div>
              </header>
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                  {children}
                </div>
              </div>
            </main>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
