"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Wallet, History, ArrowRight, Zap, Sparkles, Plus, Minus } from "lucide-react";

export default function WalletDashboardPage() {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: async () => {
      const response = await api.get('/wallet/me');
      return response.data;
    }
  });

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 flex flex-col h-full lg:h-[calc(100vh-200px)] min-h-[550px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-500 font-medium">Manage your tokens and billing history.</p>
        </div>
        <Link 
          href="/wallet/top-up"
          className="bg-accent-primary hover:bg-accent-hover text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-accent-primary/20"
        >
          <Zap size={20} />
          Top Up Tokens
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 lg:col-span-1 h-full">
          {/* Balance Card */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-accent-primary/10 text-accent-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Wallet size={24} />
              </div>
              <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Available Balance</h3>
            </div>
            
            <div className="text-5xl font-black text-gray-900 mb-2 flex-shrink-0">
              {isLoading ? "..." : (wallet?.balance?.toLocaleString() || 0)}
            </div>
            <p className="text-sm text-gray-400 font-medium mb-6">Tokens never expire.</p>
            
            <div className="mt-auto pt-2">
              <Link 
                href="/wallet/top-up"
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-3 rounded-xl transition-all"
              >
                Buy More Tokens <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Total Spent Card */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm flex-1 flex flex-col min-h-[180px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} />
              </div>
              <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total Tokens Spent</h3>
            </div>
            
            <div className="text-4xl font-black text-gray-900 mb-2 mt-auto flex-shrink-0">
              {isLoading ? "..." : (wallet?.totalSpent?.toLocaleString() || 0)}
            </div>
            <p className="text-sm text-gray-400 font-medium">Used across all searches.</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <History size={24} className="text-gray-400" />
              Recent Transactions
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gray-50/50 rounded-2xl border border-gray-100/50">
            {!wallet?.transactions || wallet.transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <History size={24} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No transactions yet</h3>
                <p className="text-gray-500 text-sm">When you top up or spend tokens, your history will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/50">
                {wallet.transactions.map((tx: any) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'JOB_REFUND' ? 'bg-yellow-100 text-yellow-600' :
                        tx.type === 'ADMIN_CREDIT' ? 'bg-blue-100 text-blue-600' :
                        tx.amount < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {tx.amount > 0 ? <Plus size={18} /> : <Minus size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{tx.description || (tx.amount > 0 ? 'Tokens Top Up' : 'Tokens Used')}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className={`font-black text-lg ${
                      tx.type === 'JOB_REFUND' ? 'text-yellow-500' :
                      tx.type === 'ADMIN_CREDIT' ? 'text-blue-500' :
                      tx.amount < 0 ? 'text-red-500' : 'text-green-600'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
