import { Sidebar } from '../../components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white text-[#111827] font-sans overflow-hidden p-2">
      <div className="flex h-full w-full bg-white rounded-[32px] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-white relative">
          <div className="p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
