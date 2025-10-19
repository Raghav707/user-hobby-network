// File: frontend/src/App.tsx
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import UserPanel from './components/UserPanel';
import TopBar from './components/TopBar';
import UserGraph from './components/UserGraph';

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <TopBar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4">
            <UserGraph />
          </main>
          <UserPanel />
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}
