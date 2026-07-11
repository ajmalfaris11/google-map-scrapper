import { Sidebar } from '../../components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f3f4f6] text-[#111827] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#ffffff]">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
