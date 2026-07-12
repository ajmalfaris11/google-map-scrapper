import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

import { FullScreenToggle } from "@/components/FullScreenToggle";
import { Logo } from "@/components/Logo";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { WalletHeader } from "@/components/WalletHeader";

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
      <body className={`${outfit.variable} font-sans antialiased bg-gradient-to-b from-[#0052ff] to-[#002880] text-text-frame h-screen overflow-hidden flex flex-col md:flex-row p-0 md:p-4 selection:bg-accent-primary/30`} suppressHydrationWarning>
        <Providers>
          <AuthGuard>
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-bg-canvas text-text-primary rounded-t-[2rem] rounded-b-none md:rounded-[2rem] overflow-hidden shadow-2xl ml-0 md:ml-2 border-t md:border border-border-color/50 pb-20 md:pb-0 mt-4 md:mt-0">
              <header className="h-16 md:h-20 border-b border-border-color/30 bg-transparent sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between">
                <div className="hidden md:flex items-center gap-2 w-1/3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                  </span>
                  <span className="text-sm text-text-secondary font-medium">System Online</span>
                </div>
                <div className="flex-1 flex justify-start md:justify-center items-center">
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-wide text-text-primary flex items-center drop-shadow-sm absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
                    <Logo size={40} className="md:w-[50px] md:h-[50px] w-10 h-10" />
                    <span className="bg-clip-text">
                      SCRAPPER
                    </span>
                  </h1>
                </div>
                <div className="flex items-center justify-end gap-4 w-auto md:w-1/3">

                  <WalletHeader />
                  <FullScreenToggle />
                </div>
              </header>
              <div className="flex-1 p-4 md:p-8 overflow-y-auto">
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
