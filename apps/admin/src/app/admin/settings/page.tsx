'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<{key: string, value: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const fetchSettings = async () => {
    const token = getCookie('jwt');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSettings(await res.json());
    }
    setLoading(false);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getCookie('jwt');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    });
    alert('Settings saved successfully!');
  };

  const updateSetting = (index: number, value: string) => {
    const newSettings = [...settings];
    newSettings[index].value = value;
    setSettings(newSettings);
  };

  const addSetting = () => {
    setSettings([...settings, { key: '', value: '' }]);
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          Global Settings
        </h2>
        <button
          onClick={addSetting}
          className="px-4 py-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-xl font-medium transition-colors"
        >
          Add Setting
        </button>
      </div>

      <form onSubmit={saveSettings} className="bg-gray-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4">
        {settings.map((setting, index) => (
          <div key={index} className="flex gap-4">
            <input
              type="text"
              placeholder="Key"
              value={setting.key}
              onChange={(e) => {
                const newSettings = [...settings];
                newSettings[index].key = e.target.value;
                setSettings(newSettings);
              }}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Value"
              value={setting.value}
              onChange={(e) => updateSetting(index, e.target.value)}
              className="flex-2 bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-teal-500 transition-colors w-full"
            />
          </div>
        ))}

        {settings.length === 0 && (
          <p className="text-gray-400">No settings found. Click 'Add Setting' to create one.</p>
        )}

        <div className="pt-4 border-t border-white/10">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
