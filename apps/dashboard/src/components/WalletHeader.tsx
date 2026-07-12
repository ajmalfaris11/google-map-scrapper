'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Wallet } from 'lucide-react';

export function WalletHeader() {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: async () => {
      const response = await api.get('/wallet/me');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <Link href="/wallet" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer border border-black/5 dark:border-white/10">
      <Wallet className="w-4 h-4 text-text-primary drop-shadow-sm" />
      <span className="text-sm font-bold text-text-primary tracking-wide">
        {isLoading ? '...' : (wallet?.balance?.toLocaleString() || '0')}
      </span>
      <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] border border-[#60a5fa] shadow-[0_0_10px_rgba(59,130,246,0.5)] overflow-hidden">
        <div className="absolute inset-0 rounded-full border-[1.5px] border-black/10"></div>
        <div className="absolute inset-[2px] rounded-full border border-white/30"></div>
        <Logo size={14} className="w-3.5 h-3.5 brightness-0 invert drop-shadow-md z-10" />
      </div>
    </Link>
  );
}
