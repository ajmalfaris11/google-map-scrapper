'use client';

import { useEffect, useState } from 'react';
import { Settings, Plus, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchSettings = async () => {
    setLoading(true);
    const token = getCookie('jwt');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      setSettings(await res.json());
    }
    setLoading(false);
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    const token = getCookie('jwt');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key, value }),
    });

    if (res.ok) {
      setSuccessMsg('Setting saved successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSettings();
    }
    setSaving(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;
    
    await handleSave(newKey, newValue);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="text-[#0052ff]" size={32} />
          System Settings
        </h2>
        {successMsg && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2 border border-green-200">
             <CheckCircle2 size={16} />
             <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
           <h3 className="text-lg font-bold text-gray-900">Add New Setting</h3>
           <p className="text-sm text-gray-500 mt-1">Create a new key-value configuration pair for the system.</p>
           
           <form onSubmit={handleAdd} className="mt-6 flex flex-col sm:flex-row gap-4">
             <div className="flex-1">
               <input
                 type="text"
                 placeholder="Setting Key (e.g., SCRAPER_API_KEY)"
                 value={newKey}
                 onChange={(e) => setNewKey(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff] transition-all text-gray-900 placeholder-gray-400"
               />
             </div>
             <div className="flex-1">
               <input
                 type="text"
                 placeholder="Setting Value"
                 value={newValue}
                 onChange={(e) => setNewValue(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff] transition-all text-gray-900 placeholder-gray-400"
               />
             </div>
             <button
               type="submit"
               disabled={saving || !newKey || !newValue}
               className="bg-[#0052ff] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#0040d1] focus:ring-4 focus:ring-[#0052ff]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Plus size={18} />
               Add
             </button>
           </form>
        </div>
        
        <div className="p-0 relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0052ff]"></div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
             {settings.length > 0 ? (
               settings.map((setting) => (
                 <SettingItem 
                    key={setting.id} 
                    setting={setting} 
                    onSave={handleSave} 
                    disabled={saving} 
                 />
               ))
             ) : (
               <div className="p-12 text-center text-gray-500">
                 No custom settings found. Add one above.
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ setting, onSave, disabled }: { setting: any, onSave: (k: string, v: string) => void, disabled: boolean }) {
  const [value, setValue] = useState(setting.value);
  const isChanged = value !== setting.value;

  return (
    <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-colors group">
      <div className="w-1/3">
        <label className="text-sm font-semibold text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
          {setting.key}
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Last updated: {new Date(setting.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex-1 flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#0052ff] focus:ring-1 focus:ring-[#0052ff] transition-all text-gray-900"
        />
        <button
          onClick={() => onSave(setting.key, value)}
          disabled={disabled || !isChanged}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-900 focus:ring-4 focus:ring-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );
}
