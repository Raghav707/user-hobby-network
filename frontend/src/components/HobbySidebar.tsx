import { useEffect, useMemo, useState } from 'react';
import { fetchUsers } from '../lib/api';
import type { User } from '../lib/types';
import { toast } from 'sonner';

export default function HobbySidebar({ onDataChanged }: { onDataChanged: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchUsers();
        setUsers(all);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load hobbies');
      }
    })();
  }, []);

  const hobbies = useMemo(() => {
    const set = new Set<string>();
    for (const u of users) (u.hobbies || []).forEach((h) => set.add(h));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filtered = hobbies.filter((h) => h.toLowerCase().includes(q.toLowerCase()));

  const onDragStart = (evt: React.DragEvent, hobby: string) => {
    evt.dataTransfer.setData('application/hobby', JSON.stringify({ hobby }));
    evt.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="rounded-2xl border bg-white shadow p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Hobbies</h2>
        <button
          onClick={onDataChanged}
          className="text-xs px-2 py-1 rounded border bg-slate-50 hover:bg-slate-100"
          title="Refresh graph after changes"
        >
          Refresh Graph
        </button>
      </div>

      <div className="mt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hobbies..."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      <div className="mt-3 max-h-[64vh] overflow-auto space-y-2 pr-1">
        {filtered.length === 0 && (
          <div className="text-xs text-slate-500">No hobbies found.</div>
        )}
        {filtered.map((hobby) => (
          <div
            key={hobby}
            draggable
            onDragStart={(e) => onDragStart(e, hobby)}
            className="cursor-grab active:cursor-grabbing select-none text-sm px-3 py-2 rounded-lg border bg-slate-50 hover:bg-slate-100"
            title="Drag onto a selected user node"
          >
            {hobby}
          </div>
        ))}
      </div>
    </div>
  );
}
