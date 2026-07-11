'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, Briefcase, Building2, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import Image from 'next/image';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { name: 'Businesses', href: '/admin/businesses', icon: Building2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
        method: 'POST',
      });
    } catch (e) {
      console.error(e);
    }
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;';
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-[#0052ff] flex flex-col shrink-0 overflow-hidden text-white relative rounded-r-4xl">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-cover brightness-0 invert" />
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Admin
          </h1>
        </div>
      </div>

      <nav className="flex-1 py-6 pl-6 pr-0 space-y-3 overflow-y-auto sidebar-nav-container">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-6 py-3.5 rounded-full group relative",
                isActive
                  ? "sidebar-active-link"
                  : "text-blue-100/80 hover:text-white hover:bg-white/10 mr-6 transition-all duration-200"
              )}
            >
              <Icon size={20} className={cn("transition-colors", isActive ? "text-[#0052ff]" : "text-blue-200/80 group-hover:text-white")} />
              <span className="font-semibold text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-3.5 w-full text-left text-blue-100/80 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-200 group"
        >
          <LogOut size={20} className="text-blue-200/80 group-hover:text-white transition-colors" />
          <span className="font-semibold text-sm tracking-wide">Logout</span>
        </button>
      </div>
    </div>
  );
}
