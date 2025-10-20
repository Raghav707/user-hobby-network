// File: frontend/src/components/UserGraph.tsx
import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  type Connection,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { fetchGraph, updateUserDebounced, linkUsers, unlinkUsers } from '../lib/api';
import type { GraphResponse, RFNodeData } from '../lib/types';
import { toast } from 'sonner';
import { HighScoreNode } from './nodes/HighScoreNode';
import { LowScoreNode } from './nodes/LowScoreNode';
import { Spinner } from './ui/Spinner';
import { useApp } from '../context/AppContext';

/** Keep these OUTSIDE the component to avoid React Flow warning #002 */
export const nodeTypes = {
  high: HighScoreNode,
  low: LowScoreNode,
};
export const edgeTypes = {};

// ✅ UPDATED: removed prop, use refreshVersion from context
export default function UserGraph() {
  const { pushHistory, refreshVersion, currentNodePositions } = useApp(); // ✅ Get currentNodePositions

  // ✅ nodes are React Flow Nodes whose .data is RFNodeData
  const [nodes, setNodes, _onNodesChange] = useNodesState<RFNodeData>([]);

  // ✅ edges are React Flow Edges
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: GraphResponse = await fetchGraph();

      // Circular layout
      const count = data.users.length;
      const radius = count > 1 ? count * 40 : 0;
      const centerX = 420;
      const centerY = 260;

      const flowNodes: RFNode<RFNodeData>[] = data.users.map((user, index) => {
        // ✅ FINAL, SAFER FIX:
        // 1. Clean the hobbies data
        const cleanHobbies = (typeof user.hobbies === 'string')
          ? (user.hobbies as any).split(',').filter(Boolean)
          : Array.isArray(user.hobbies) ? user.hobbies : [];

        // 2. Create a clean user object
        const cleanUser = {
          ...user,
          hobbies: cleanHobbies,
        };

        // 3. Use the clean user data from now on
        const angle = count ? (index / count) * 2 * Math.PI : 0;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const score = cleanUser.popularityScore ?? 0;
        const type = score > 5 ? 'high' : 'low';

        return {
          id: cleanUser.id,
          type,
          position: { x, y },
          data: {
            label: `${cleanUser.username} (Age: ${cleanUser.age})`,
            userData: cleanUser, // <-- We now pass the 100% safe user object
            _version: `${cleanUser.id}-${cleanUser.popularityScore}`,
          },
        };
      });

      const flowEdges: RFEdge[] = data.friendships.map((f) => ({
        id: `e-${f.user_id_a}-${f.user_id_b}`,
        source: f.user_id_a,
        target: f.user_id_b,
        animated: true,
        style: { stroke: '#0ea5e9', strokeWidth: 2 },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (e: any) {
      setError(e?.message || 'Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    load();
  }, [load, refreshVersion]); // ✅ still uses refreshVersion

  // --- ✅ NEW EFFECT TO APPLY HISTORY ---
 useEffect(() => {
     console.log('History effect running. currentNodePositions:', currentNodePositions); // ✅ ADD LOG
     // Only apply if we have a valid state from history
     if (currentNodePositions && currentNodePositions.length > 0) { 
         console.log("Applying history state:", currentNodePositions); // ✅ ADD LOG
         setNodes(currentNodes => 
             currentNodes.map(node => {
                 // Find the matching node position in the history state
                 const historyNode = currentNodePositions.find(hn => hn.id === node.id);
                 // If found, update this node's position; otherwise, keep its current position
                 return historyNode ? { ...node, position: historyNode.position } : node;
             })
         );
     } else {
         console.log("No valid history state to apply."); // ✅ ADD LOG
     }
     // Note: We don't run this when currentNodePositions is null (initial state)
     // or empty, to avoid potentially clearing the initial layout.
 }, [currentNodePositions, setNodes]); // Depend on the history state and the setter function
 // --- END NEW EFFECT ---

 // replace your onNodesChange with this:
 const onNodesChangeWrapped = useCallback(
   (changes: NodeChange[]) => {
     setNodes((nds) => applyNodeChanges(changes, nds)); // Simplified!
   },
   [setNodes] // Removed pushHistory from dependencies
 );

  // Removed the empty useEffect here

  /** LINK: draw connection A -> B to create friendship */
  const onConnect = useCallback(
    async (params: Connection | RFEdge) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
      try {
        await linkUsers(String(params.source), String(params.target));
        toast.success('Users linked');
      } catch (err: any) {
        setEdges((eds) => eds.filter((e) => !(e.source === params.source && e.target === params.target)));
        const msg = String(err?.message || '');
        if (msg.includes('409') || msg.toLowerCase().includes('conflict')) {
          toast.info('Already linked');
        } else {
          toast.error('Failed to link users');
        }
      } finally {
        await load();
      }
    },
    [setEdges, load]
  );

  /** UNLINK: click an edge to remove (with confirm) */
  const onEdgeClick = useCallback(
    async (_: React.MouseEvent, edge: RFEdge) => {
      const { source, target } = edge;
      const ok = window.confirm('Remove this friendship?');
      if (!ok) return;

      try {
        await unlinkUsers(String(source), String(target));
        toast.success('Friendship removed');
        await load();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to unlink');
      }
    },
    [load]
  );

  /** Also handle Delete/Backspace removing edges (bulk) */
  const onEdgesDelete = useCallback(
    async (deletedEdges: RFEdge[]) => {
      for (const e of deletedEdges) {
        try {
          await unlinkUsers(String(e.source), String(e.target));
        } catch {
          // ignore individual errors; we’ll refresh after loop
        }
      }
      await load();
    },
    [load]
  );

  // Track selection (so we can drop hobbies to selected user)
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: RFNode<RFNodeData>[] }) => {
      setSelectedNodeId(selectedNodes.length ? selectedNodes[0].id : null);
    },
    []
  );

  // Allow drops from our HobbySidebar
  const onDragOver = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    async (evt: React.DragEvent) => {
      evt.preventDefault();
      const raw = evt.dataTransfer.getData('application/hobby');
      if (!raw) return;
      if (!selectedNodeId) {
        toast.error('Select a user node first, then drop a hobby.');
        return;
      }
      try {
        const { hobby } = JSON.parse(raw) as { hobby: string };
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (!node) return;

        // node.data is already RFNodeData because of our hook generic
        const user = node.data.userData;
        // Use the cleaned hobbies for includes check
        const userHobbies = [...(user.hobbies ?? [])]; 

        if (userHobbies.includes(hobby)) {
          toast.info('User already has this hobby');
          return;
        }

        const updated = [...userHobbies, hobby];
        // Ensure hobbies are sent correctly if updateUserDebounced expects an array
        await updateUserDebounced(selectedNodeId, { hobbies: updated }); 
        toast.success(`Added hobby "${hobby}"`);
        await load();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to add hobby');
      }
    },
    [selectedNodeId, nodes, load] // Added `nodes` dependency as it's used inside
  );

  if (isLoading)
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Spinner label="Loading graph data…" />
      </div>
    );

  if (error)
    return (
      <div className="h-[80vh] flex items-center justify-center text-red-600">
        Error: {error}
      </div>
    );

  if (!nodes.length)
    return (
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="h-[80vh] flex flex-col items-center justify-center text-slate-600 border rounded-xl shadow bg-white"
      >
        <p className="text-lg font-semibold">No users yet</p>
        <p className="text-sm mt-1">Create users from the panel to see them on the graph.</p>
      </div>
    );

  return (
    <div className="h-[80vh] w-full rounded-2xl border bg-gradient-to-br from-slate-50 to-white shadow-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWrapped}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDragStop={(_event, _node, nodes) => pushHistory(nodes)}
        fitView
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
      >
        <Background />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
}