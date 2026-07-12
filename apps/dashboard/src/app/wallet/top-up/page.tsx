"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Coins, Zap, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

const PACKAGES = [
  {
    id: "starter",
    tokens: 100,
    price: "₹299",
    originalPrice: "₹500",
    name: "Starter Pack",
    description: "Perfect for testing and small projects",
    popular: false,
    cardClass: "border-gray-200 bg-white hover:border-gray-300",
    buttonClass: "bg-white border-2 border-gray-200 text-gray-800 hover:bg-gray-50",
    iconColor: "text-gray-500",
  },
  {
    id: "pro",
    tokens: 500,
    price: "₹1,299",
    originalPrice: "₹2,500",
    name: "Professional",
    description: "Ideal for growing businesses and agencies",
    popular: true,
    cardClass: "border-accent-primary bg-white shadow-xl shadow-accent-primary/10 relative transform md:-translate-y-4",
    buttonClass: "bg-accent-primary border-2 border-accent-primary text-white hover:bg-accent-hover",
    iconColor: "text-accent-primary",
  },
  {
    id: "agency",
    tokens: 1000,
    price: "₹1,999",
    originalPrice: "₹5,000",
    name: "Agency",
    description: "For high-volume lead generation",
    popular: false,
    cardClass: "border-gray-200 bg-white hover:border-gray-300",
    buttonClass: "bg-white border-2 border-gray-200 text-gray-800 hover:bg-gray-50",
    iconColor: "text-gray-500",
  }
];

export default function WalletPage() {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: async () => {
      const response = await api.get('/wallet/me');
      return response.data;
    }
  });

  const handlePurchase = (pkg: any) => {
    toast.success(`Processing purchase for ${pkg.tokens} tokens...`);
    setTimeout(() => {
      toast.success("Top up successful! (Demo mode)");
    }, 1500);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 md:mb-24 relative">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Fuel Your Pipeline</h1>
          <p className="text-lg text-gray-500 font-medium max-w-md">Purchase tokens instantly and never run out of high-quality leads.</p>
        </div>

        {/* Current Balance Card */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-6 relative z-10 overflow-hidden group">
          <div className="flex flex-col relative z-10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Tokens</span>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-gray-900 tracking-tight">
                {isLoading ? "..." : (wallet?.balance?.toLocaleString() || 0)}
              </span>
            </div>
          </div>
          <div className="w-[1px] h-12 bg-gray-200 relative z-10"></div>
          <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center shadow-lg shadow-accent-primary/40 relative z-10 transition-transform duration-500 group-hover:scale-110">
            <div className="w-8 h-8 relative brightness-0 invert">
              <Image src="/logo.png" alt="Token" fill className="object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PACKAGES.map((pkg) => (
          <div 
            key={pkg.id}
            className={`rounded-3xl border-2 p-8 flex flex-col transition-all duration-300 ${pkg.cardClass} min-h-[400px]`}
          >
            {pkg.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-primary text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full flex items-center gap-1 z-10">
                <Sparkles size={14} /> Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              <p className="text-sm text-gray-500 font-medium h-10">{pkg.description}</p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-gray-900 tracking-tight">{pkg.price}</span>
                {pkg.originalPrice && (
                  <span className="text-2xl font-bold text-gray-400 line-through mb-1.5">{pkg.originalPrice}</span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-600">Total Tokens</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-900">{pkg.tokens.toLocaleString()}</span>
                    <Coins size={16} className={pkg.iconColor} />
                  </div>
                </li>
                <li className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-600">Never Expires</span>
                  <CheckCircle2 size={18} className="text-green-500" />
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handlePurchase(pkg)}
              className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${pkg.buttonClass}`}
            >
              Buy {pkg.tokens} Tokens
            </button>
          </div>
        ))}
      </div>

      {/* Features / Trust signals */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-10 pt-12 border-t border-gray-100">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
            <Zap size={24} className="text-gray-500" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Lightning Fast Delivery</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">Your token balance is updated instantly the moment your transaction succeeds.</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
            <Shield size={24} className="text-gray-500" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Bank-Grade Security</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">All payments are encrypted and processed through our verified secure gateway.</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-gray-500" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Tokens Never Expire</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">Keep your tokens as long as you want. There are no hidden fees or expiration dates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
