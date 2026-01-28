import { GlassCard } from '@/app/components/glass-card';
import { LogOut, User as UserIcon, Book, Mail } from 'lucide-react';

export function Profile() {
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'AJ',
    subjects: ['React.js', 'TypeScript', 'Node.js', 'CSS Grid', 'Next.js'],
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/95">Profile</h1>
      </div>

      {/* User Info Card */}
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#EF476F] via-[#f85e81] to-[#FFD166] flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-[0_0_32px_rgba(239,71,111,0.5)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
            <span className="relative z-10">{user.avatar}</span>
          </div>

          {/* Name & Email */}
          <h2 className="text-xl font-bold text-white/95 mb-1">{user.name}</h2>
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 w-full pt-4 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold text-[#06D6A0] mb-1" style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}>24h</div>
              <div className="text-xs text-white/50">Study Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EF476F] mb-1" style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}>7</div>
              <div className="text-xs text-white/50">Day Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#FF8C42] mb-1" style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}>12</div>
              <div className="text-xs text-white/50">Tasks Done</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Subjects */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-white/90" />
          <h3 className="text-lg text-white/90">My Subjects</h3>
        </div>
        <GlassCard className="p-4">
          <div className="space-y-3">
            {user.subjects.map((subject, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#06D6A0', '#FF8C42', '#EF476F', '#FFD166', '#ADB5BD'][index % 5],
                      boxShadow: `0 0 12px ${['#06D6A0', '#FF8C42', '#EF476F', '#FFD166', '#ADB5BD'][index % 5]}, 0 0 24px ${['#06D6A0', '#FF8C42', '#EF476F', '#FFD166', '#ADB5BD'][index % 5]}80`,
                    }}
                  />
                  <span className="text-white/90">{subject}</span>
                </div>
                <div className="text-xs text-white/50">Active</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Settings */}
      <div className="mb-6">
        <h3 className="text-lg text-white/90 mb-4">Settings</h3>
        <div className="space-y-3">
          <GlassCard className="p-4">
            <button className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-white/60" />
                <span className="text-white/90">Edit Profile</span>
              </div>
              <span className="text-white/60">›</span>
            </button>
          </GlassCard>

          <GlassCard className="p-4">
            <button className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-3">
                <Book className="w-5 h-5 text-white/60" />
                <span className="text-white/90">Manage Subjects</span>
              </div>
              <span className="text-white/60">›</span>
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Logout Button */}
      <button className="w-full p-4 rounded-2xl bg-[#EF476F]/20 border border-[#EF476F]/40 hover:bg-[#EF476F]/30 transition-all flex items-center justify-center gap-2 relative overflow-hidden" style={{ boxShadow: '0 0 20px rgba(239,71,111,0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
        <LogOut className="w-5 h-5 text-[#EF476F] relative z-10" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
        <span className="font-semibold text-[#EF476F] relative z-10">Logout</span>
      </button>
    </div>
  );
}