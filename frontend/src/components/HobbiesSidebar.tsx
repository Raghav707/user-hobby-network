// File: frontend/src/components/HobbiesSidebar.tsx
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const DEFAULT_HOBBIES = [
  'football', 'basketball', 'cricket', 'coding', 'gaming', 'reading',
  'music', 'movies', 'travel', 'cooking', 'yoga', 'swimming',
  'running', 'photography', 'art', 'dance'
];

type Props = { onChanged?: () => void };

export function HobbiesSidebar({ onChanged }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_HOBBIES;
    return DEFAULT_HOBBIES.filter((h) => h.toLowerCase().includes(q));
  }, [query]);

  const onDragStart = (ev: React.DragEvent, hobby: string) => {
    // our graph listens for "application/hobby"
    ev.dataTransfer.setData('application/hobby', JSON.stringify({ hobby }));
    ev.dataTransfer.effectAllowed = 'copy';
    toast.info(`Drag "${hobby}" onto a selected node`);
    onChanged?.();
  };

  return (
    <div className="rounded-2xl border bg-white shadow p-4">
      <h2 className="text-lg font-semibold">Hobbies</h2>

      <input
        className="mt-3 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
        placeholder="Search hobby…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        {filtered.map((hobby) => (
          <button
            key={hobby}
            draggable
            onDragStart={(e) => onDragStart(e, hobby)}
            className="rounded-lg border px-3 py-2 text-sm hover:border-sky-400 hover:bg-sky-50 active:scale-[0.99] transition"
            title="Drag me onto a node"
          >
            {hobby}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Tip: Click a node to select it, then drop a hobby onto the graph area.
      </p>
    </div>
  );
}
