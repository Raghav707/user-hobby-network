// File: frontend/src/components/ui/Spinner.tsx
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-600">
      <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" fill="none" />
      </svg>
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
