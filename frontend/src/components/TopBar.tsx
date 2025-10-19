// File: frontend/src/components/TopBar.tsx
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function TopBar() {
  const { undo, redo, refresh } = useApp();

  const handleUndo = () => {
    const res = undo();
    if (!res) toast.info('Nothing to undo');
    else toast.success('Undid last move');
  };

  const handleRedo = () => {
    const res = redo();
    if (!res) toast.info('Nothing to redo');
    else toast.success('Redid move');
  };

  return (
    <header className="h-14 border-b bg-white/80 backdrop-blur flex items-center justify-between px-4">
      <h1 className="text-base font-semibold text-slate-800">User Relationship & Hobby Network</h1>
      <div className="flex gap-2">
        <button onClick={handleUndo} className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50">Undo</button>
        <button onClick={handleRedo} className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50">Redo</button>
        <button onClick={refresh} className="rounded-lg bg-sky-600 text-white px-3 py-1 text-sm hover:bg-sky-700">Refresh</button>
      </div>
    </header>
  );
}
