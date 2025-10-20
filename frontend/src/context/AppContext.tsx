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
  currentNodePositions: NodePos[] | null;

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
    console.log('--- pushHistory called ---'); // ✅ ADD LOG
    // store only positions to keep it light
    const positions: NodePos[] = nodes.map((n) => ({ id: n.id, position: n.position }));
    const entry: HistoryEntry = { id: nanoid(), positions };
    console.log('Saving positions:', positions); // ✅ ADD LOG

    // drop any "redo" branch (simplified & safer for batching)
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(entry);
    console.log('New history length:', nextHistory.length); // ✅ ADD LOG
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1); // Set index directly to the new end
    console.log('New history index:', nextHistory.length - 1); // ✅ ADD LOG
  };

  const undo = () => {
    console.log('--- undo called ---'); // ✅ ADD LOG
    console.log('Current index:', historyIdx, 'History length:', history.length); // ✅ ADD LOG
    if (historyIdx <= 0) {
      console.log('Cannot undo further.'); // ✅ ADD LOG
      return null;
    }
    setHistoryIdx((i) => {
      const nextIdx = i - 1;
      console.log('Set index to (undo):', nextIdx); // ✅ ADD LOG
      return nextIdx;
    });
    const entry = history[historyIdx - 1]; // Get the state we are GOING TO
    console.log('Returning positions from history index:', historyIdx - 1, entry?.positions); // ✅ ADD LOG
    return entry?.positions || null; // This return value isn't actually used by the graph anymore
  };

  const redo = () => {
    console.log('--- redo called ---'); // ✅ ADD LOG
    console.log('Current index:', historyIdx, 'History length:', history.length); // ✅ ADD LOG
    if (historyIdx >= history.length - 1) {
      console.log('Cannot redo further.'); // ✅ ADD LOG
      return null;
    }
    setHistoryIdx((i) => {
      const nextIdx = i + 1;
      console.log('Set index to (redo):', nextIdx); // ✅ ADD LOG
      return nextIdx;
    });
    const entry = history[historyIdx + 1]; // Get the state we are GOING TO
    console.log('Returning positions from history index:', historyIdx + 1, entry?.positions); // ✅ ADD LOG
    return entry?.positions || null; // This return value isn't actually used by the graph anymore
  };

  const currentNodePositions = history[historyIdx]?.positions || null;
  const value = useMemo<AppCtx>(
    () => ({ refreshVersion, refresh, pushHistory, undo, redo, hobbies, setHobbies, currentNodePositions }),
    [refreshVersion, historyIdx, hobbies, currentNodePositions] // Ensure historyIdx is included if state calculation depends on it indirectly
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
