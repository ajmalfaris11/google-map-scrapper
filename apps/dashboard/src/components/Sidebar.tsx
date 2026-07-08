"use client";

import { Zap, LayoutDashboard, Search, Users, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { useState, useEffect, useRef } from "react";

export function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
      toast.success("Logged out successfully");
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isAuthenticated && pathname === "/login") {
    return null;
  }

  return (
    <aside className="w-24 flex flex-col shrink-0 sticky top-0 h-full z-10 items-center py-6 gap-8 border-none bg-transparent text-text-frame">
      <div className="w-full flex justify-center">
        <div className="w-10 h-10 rounded-full bg-text-frame text-bg-frame flex items-center justify-center font-bold text-xl shadow-md">
          <Zap size={20} />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col justify-center gap-6 items-center w-full">
        <Link 
          href="/" 
          className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
            pathname === '/' 
              ? 'bg-bg-canvas text-accent-primary shadow-lg scale-110' 
              : 'text-text-frame/80 hover:text-text-frame hover:bg-white/10'
          }`}
        >
          <LayoutDashboard size={22} />
          <span className="absolute left-16 bg-bg-canvas text-text-primary px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border-color/20">
            Overview
          </span>
        </Link>
        
        <Link 
          href="/jobs/new" 
          className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
            pathname === '/jobs/new' 
              ? 'bg-bg-canvas text-accent-primary shadow-lg scale-110' 
              : 'text-text-frame/80 hover:text-text-frame hover:bg-white/10'
          }`}
        >
          <Search size={22} />
          <span className="absolute left-16 bg-bg-canvas text-text-primary px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border-color/20">
            Search
          </span>
        </Link>
        
        <Link 
          href="/leads" 
          className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
            pathname === '/leads' 
              ? 'bg-bg-canvas text-accent-primary shadow-lg scale-110' 
              : 'text-text-frame/80 hover:text-text-frame hover:bg-white/10'
          }`}
        >
          <Users size={22} />
          <span className="absolute left-16 bg-bg-canvas text-text-primary px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-border-color/20">
            Leads
          </span>
        </Link>
      </nav>
      
      {user && (
        <div className="relative w-full flex justify-center mt-auto" ref={menuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-white text-bg-frame flex items-center justify-center font-bold text-sm shadow-lg uppercase transition-all hover:opacity-90 focus:outline-none"
          >
            {user.email.substring(0, 2)}
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-4 left-14 w-36 bg-bg-canvas rounded-xl shadow-2xl border border-border-color/20 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logoutMutation.mutate();
                }}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-primary hover:bg-error/10 hover:text-error transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
