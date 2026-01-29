import { Home, ListTodo, Clock, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'timesheet', icon: Clock, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Liquid glass navigation bar */}
      <div className="relative">
        {/* Main glass container */}
        <div className="backdrop-blur-3xl bg-gradient-to-t from-white/[0.12] to-white/[0.06] border-t border-white/20 shadow-[0_-8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] relative overflow-hidden">
          {/* Top specular highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            }}
          />
          
          {/* Top glow */}
          <div 
            className="absolute top-0 left-1/4 right-1/4 h-8 opacity-30 blur-xl"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 70%)',
            }}
          />
          
          <div className="max-w-md mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className="flex flex-col items-center gap-1 relative group"
                  >
                    <div className={`
                      p-2 rounded-2xl transition-all duration-300 relative overflow-hidden
                      ${isActive ? 'bg-gradient-to-br from-[#06D6A0]/30 to-[#FF8C42]/20 border border-[#06D6A0]/40' : 'hover:bg-white/10'}
                    `}
                    style={isActive ? { boxShadow: '0 0 20px rgba(6,214,160,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' } : {}}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                      )}
                      <Icon 
                        className={`w-6 h-6 transition-colors relative z-10 ${
                          isActive ? 'text-[#06D6A0]' : 'text-white/60'
                        }`}
                        style={isActive ? { filter: 'drop-shadow(0 0 8px currentColor)' } : {}}
                      />
                    </div>
                    
                    {isActive && (
                      <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#06D6A0]" style={{ boxShadow: '0 0 12px rgba(6,214,160,0.8), 0 0 24px rgba(6,214,160,0.6)' }} />
                    )}
                    
                    <span className={`text-xs transition-colors ${
                      isActive ? 'text-white/95' : 'text-white/60'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}