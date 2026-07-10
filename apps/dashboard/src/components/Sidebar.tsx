"use client";

import { LayoutDashboard, Search, Users, LogOut, Bookmark, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { useState, useEffect, useRef } from "react";

export function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated && pathname === "/login") {
    return null;
  }

  return (
    <aside className="fixed bottom-0 left-0 w-full h-16 md:relative md:w-24 flex flex-row md:flex-col shrink-0 md:sticky md:top-0 md:h-full z-[100] md:z-10 items-center justify-between md:justify-start px-6 md:px-0 py-0 md:py-6 gap-0 md:gap-8 border-t border-border-color/20 md:border-none bg-white md:bg-transparent text-text-frame shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none transition-all pb-safe">
      <div className="hidden md:flex w-full justify-center">
        <div className="w-14 h-14 rounded-full bg-text-frame text-bg-frame flex items-center justify-center shadow-lg overflow-hidden">
          <Logo size={56} />
        </div>
      </div>

      <div className="contents md:flex md:flex-1 md:items-center md:w-full md:justify-center">
        <nav className="contents md:flex md:flex-col md:gap-4 md:items-center md:bg-white md:p-2.5 md:rounded-full md:shadow-2xl md:w-auto md:justify-start">
          <Link
            href="/"
            className={`group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-20 rounded-full transition-all ${pathname === '/'
              ? 'bg-accent-primary text-white shadow-lg md:scale-110'
              : 'text-accent-primary hover:bg-blue-50'
              }`}
          >
            <LayoutDashboard size={22} />
            <span className="hidden md:block absolute left-20 bg-bg-canvas text-text-blue-500 border-blue-500 px-6 py-2.5 rounded-full text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border-color/20">
              Overview
            </span>
          </Link>

          <Link
            href="/leads"
            className={`group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-20 rounded-full transition-all ${pathname === '/leads'
              ? 'bg-accent-primary text-white shadow-lg md:scale-110'
              : 'text-accent-primary hover:bg-blue-50'
              }`}
          >
            <Users size={22} />
            <span className="hidden md:block absolute left-20 bg-bg-canvas text-text-blue-500 border-blue-500 px-6 py-2.5 rounded-full text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border-color/20">
              Leads
            </span>
          </Link>

          <Link
            href="/jobs/new"
            className={`group relative flex items-center justify-center w-12 h-12 md:w-12 md:h-20 rounded-full transition-all ${pathname === '/jobs/new'
              ? 'bg-accent-primary text-white shadow-lg md:scale-110'
              : 'text-accent-primary hover:bg-blue-50'
              }`}
          >
            <Search size={22} />
            <span className="hidden md:block absolute left-20 bg-bg-canvas text-blue-500 border-blue-500 px-6 py-2.5 rounded-full text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border-color/20">
              Search
            </span>
          </Link>

          <Link
            href="/bookmarks"
            className={`group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-20 rounded-full transition-all ${pathname === '/bookmarks'
              ? 'bg-accent-primary text-white shadow-lg md:scale-110'
              : 'text-accent-primary hover:bg-blue-50'
              }`}
          >
            <Bookmark size={22} />
            <span className="hidden md:block absolute left-20 bg-bg-canvas text-text-blue-500 border-blue-500 px-6 py-2.5 rounded-full text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border-color/20">
              Bookmarks
            </span>
          </Link>
        </nav>
      </div>

      {user && (
        <div className="relative md:w-full flex justify-center mt-0 md:mt-auto ml-0">
          <Link
            href="/profile"
            className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all hover:opacity-90 focus:outline-none p-1 ${pathname === '/profile' ? 'bg-accent-primary border-2 border-white' : 'bg-white'
              }`}
          >
            <div className={`w-full h-full rounded-full border-2 border-dashed flex items-center justify-center font-bold text-sm md:text-xl uppercase transition-colors ${pathname === '/profile' ? 'border-white text-white' : 'border-accent-primary text-accent-primary'
              }`}>
              {user.email.substring(0, 2)}
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
