'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, Briefcase, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import Image from 'next/image';

const navItems = [
  { name: 'Analytics', href: '/admin/analytics', icon: LayoutDashboard },
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
    document.cookie = 'jwt=; Max-Age=0; path=/';
    router.push('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-cover" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide">
            Admin
          </h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-[#0052ff]/10 text-[#0052ff] font-semibold" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={20} className={cn("transition-colors", isActive ? "text-[#0052ff]" : "text-gray-400 group-hover:text-gray-600")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors group"
        >
          <LogOut size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
