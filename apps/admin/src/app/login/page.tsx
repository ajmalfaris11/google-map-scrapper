'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        // Fallback for cookie parsing if the backend response does not include access_token
        const token = data.access_token || getCookie('jwt');
        if (!token) {
           setError('Authentication token missing.');
           return;
        }
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'ADMIN') {
          setError('Access denied. Administrator privileges required.');
          return;
        }
        // Explicitly set cookie so the frontend can read it later (if not HttpOnly)
        document.cookie = `jwt=${token}; path=/; max-age=86400; SameSite=Lax`;
        router.push('/admin/analytics');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    }
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0052ff] to-[#002880]">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-white p-2 rounded-2xl shadow-lg mb-4">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-center text-white tracking-wide">
            Admin Portal
          </h1>
        </div>
        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-center font-medium shadow-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:border-white focus:bg-white/30 transition-all shadow-inner"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:border-white focus:bg-white/30 transition-all shadow-inner"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-white text-[#0040d1] hover:bg-blue-50 font-bold rounded-xl transition-all transform hover:-translate-y-0.5 shadow-lg shadow-black/20"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
