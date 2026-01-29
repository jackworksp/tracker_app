import React from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import SessionCreate from './pages/SessionCreate';
import Dashboard from './pages/Dashboard';
import './App.css';

// Main Content Component to conditionally render pages
const AppContent = () => {
  const { session } = useSession();

  return (
    <div className="app-container min-h-screen bg-[#0f1115] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
      
      <main className="relative z-10 container mx-auto px-4 py-6 h-full flex flex-col">
        {session.isActive ? <Dashboard /> : <SessionCreate />}
      </main>
    </div>
  );
};

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
