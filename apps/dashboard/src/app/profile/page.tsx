"use client";

import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Shield, Calendar, Key, Bell, Settings, LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
        <User size={48} className="opacity-50" />
        <h2 className="text-xl font-medium">Not authenticated</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
        <p className="text-gray-500">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Info */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 truncate w-full" title={user.email}>
              {user.email.split('@')[0]}
            </h2>
            <p className="text-sm text-gray-500 mb-6 truncate w-full" title={user.email}>
              {user.email}
            </p>
            
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <Shield size={16} />
                  <span>Role</span>
                </div>
                <span className="font-semibold text-gray-900 capitalize">Admin</span>
              </div>
              <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={16} />
                  <span>Joined</span>
                </div>
                <span className="font-semibold text-gray-900">Just now</span>
              </div>

              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-error bg-error/10 hover:bg-error hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut size={16} />
                {logoutMutation.isPending ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Details */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="text-accent-primary" size={20} />
              Account Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-medium focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Your email address cannot be changed currently.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="text-accent-primary" size={20} />
              Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-accent-primary/30 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <Bell size={16} className="text-gray-500" />
                    Email Notifications
                  </div>
                  <p className="text-sm text-gray-500">Receive alerts about lead extraction completion.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-accent-primary/30 transition-colors opacity-60 cursor-not-allowed">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <Key size={16} className="text-gray-500" />
                    Two-Factor Authentication
                  </div>
                  <p className="text-sm text-gray-500">Add an extra layer of security (Coming soon).</p>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
