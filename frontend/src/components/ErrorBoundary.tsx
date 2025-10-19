// File: frontend/src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
          <div className="max-w-md w-full rounded-xl border bg-white p-6 shadow">
            <h1 className="text-xl font-bold text-slate-800">Something went wrong.</h1>
            <p className="mt-2 text-sm text-slate-600">{this.state.message}</p>
            <button className="mt-4 rounded-lg border px-4 py-2" onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
