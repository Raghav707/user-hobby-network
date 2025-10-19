// File: frontend/src/context/AppContext.tsx
import { createContext, useContext, useMemo, useState } from 'react';
import type { Node as RFNode } from 'reactflow';
import { nanoid } from 'nanoid';
import type { RFNodeData } from '../lib/types';

type NodePos = { id: string; position: { x: number; y: number } };
type HistoryEntry = { id: string; positions: NodePos[] };

type AppCtx = {
  refreshVersion: number;
  refresh: () => void;

  // history for undo/redo (only node positions)
  pushHistory: (nodes: RFNode<RFNodeData>[]) => void;
  undo: () => NodePos[] | null;
  redo: () => NodePos[] | null;

  // hobbies (aggregate from users for sidebar)
  hobbies: string[];
  setHobbies: (h: string[]) => void;
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [hobbies, setHobbies] = useState<string[]>([]);

  const refresh = () => {
    setRefreshVersion((v) => v + 1);
    // force immediate re-render for listeners like ReactFlow
    requestAnimationFrame(() => setRefreshVersion((v) => v + 1));
  };


  const pushHistory = (nodes: RFNode<RFNodeData>[]) => {
    // store only positions to keep it light
    const positions: NodePos[] = nodes.map((n) => ({ id: n.id, position: n.position }));
    const entry: HistoryEntry = { id: nanoid(), positions };

    // drop any "redo" branch
    setHistory((h) => [...h.slice(0, historyIdx + 1), entry]);
    setHistoryIdx((idx) => idx + 1);
  };

  const undo = () => {
    if (historyIdx <= 0) return null;
    setHistoryIdx((i) => i - 1);
    const entry = history[historyIdx - 1];
    return entry?.positions || null;
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return null;
    setHistoryIdx((i) => i + 1);
    const entry = history[historyIdx + 1];
    return entry?.positions || null;
  };

  const value = useMemo<AppCtx>(
    () => ({ refreshVersion, refresh, pushHistory, undo, redo, hobbies, setHobbies }),
    [refreshVersion, historyIdx, hobbies]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
