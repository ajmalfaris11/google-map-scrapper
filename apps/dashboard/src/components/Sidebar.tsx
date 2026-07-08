"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";

export function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

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

  if (!isAuthenticated && pathname === "/login") {
    return null; // Don't show sidebar on login page
  }

  return (
    <aside className="w-64 border-r border-border-color bg-bg-secondary flex flex-col shrink-0 sticky top-0 h-screen z-10 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-border-color">
        <span className="font-bold text-lg flex items-center gap-2">
          <span className="text-accent-primary">⚡</span> Lead Platform
        </span>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
        <Link href="/" className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${pathname === '/' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
          <span className="text-text-muted">📊</span> Dashboard
        </Link>
        
        <div className="mt-4 mb-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Scraping Engine</div>
        
        <Link href="/jobs/new" className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${pathname === '/jobs/new' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
          <span className="text-text-muted">🔍</span> New Search
        </Link>
        
        <div className="mt-4 mb-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Management</div>
        
        <Link href="/leads" className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${pathname === '/leads' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
          <span className="text-text-muted">👥</span> Leads CRM
        </Link>
      </nav>
      
      {user && (
        <div className="p-4 border-t border-border-color flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-tertiary/50 border border-border-color">
            <div className="w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center font-bold text-xs shadow-sm uppercase">
              {user.email.substring(0, 2)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate" title={user.email}>{user.email}</span>
              <span className="text-xs text-text-muted">{user.role}</span>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors font-medium"
          >
            {logoutMutation.isPending ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}
    </aside>
  );
}
