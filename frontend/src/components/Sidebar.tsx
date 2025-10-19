// File: frontend/src/components/Sidebar.tsx
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

function HobbyPill({ hobby }: { hobby: string }) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/hobby', JSON.stringify({ hobby }));
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-full px-3 py-1 text-sm bg-sky-100 text-sky-700 hover:bg-sky-200 transition"
      title="Drag onto a user node"
    >
      {hobby}
    </div>
  );
}

export default function Sidebar() {
  const { hobbies } = useApp();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hobbies;
    return hobbies.filter((h) => h.toLowerCase().includes(q));
  }, [hobbies, query]);

  return (
    <aside className="w-72 shrink-0 border-r bg-white/80 backdrop-blur p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Hobbies</h2>
        <p className="text-xs text-slate-500">Drag a hobby pill onto a user node.</p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search hobbies"
        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-sky-200"
      />

      <div className="flex flex-wrap gap-2 max-h-[60vh] overflow-auto pr-1">
        {filtered.length ? (
          filtered.map((h) => <HobbyPill key={h} hobby={h} />)
        ) : (
          <p className="text-xs text-slate-500">No hobbies found.</p>
        )}
      </div>
    </aside>
  );
}
