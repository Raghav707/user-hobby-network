// File: frontend/src/components/nodes/HighScoreNode.tsx
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

type Props = {
  data: {
    label: string;
    userData: {
      popularityScore: number;
      username: string;
      age: number;
      hobbies: string[];
    };
    _version?: string;
  };
};

export const HighScoreNode = memo(function HighScoreNode({ data }: Props) {
  const score = data.userData?.popularityScore ?? 0;

  return (
    <div
      className="rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 shadow transition-all"
      style={{ minWidth: 180 }}
    >
      <div className="text-sm font-semibold text-emerald-700">{data.label}</div>
      <div className="mt-1 text-xs text-emerald-700/80">Score: {score}</div>
      <div className="mt-1 text-[11px] text-emerald-900/70 truncate">
        Hobbies: {data.userData.hobbies?.join(', ') || '—'}
      </div>

      {/* connection points */}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
});
