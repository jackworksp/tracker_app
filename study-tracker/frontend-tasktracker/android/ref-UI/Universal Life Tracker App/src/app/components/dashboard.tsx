import { GlassCard } from '@/app/components/glass-card';
import { Clock, Flame, CheckCircle2, Book, ChevronDown } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';

export function Dashboard() {
  const stats = [
    { icon: Clock, label: 'Study Time', value: '24h', color: '#06D6A0' },
    { icon: Flame, label: 'Streak', value: '7 days', color: '#EF476F' },
    { icon: CheckCircle2, label: 'Tasks Done', value: '12', color: '#FF8C42' },
    { icon: Book, label: 'Topics', value: '8', color: '#FFD166' },
  ];

  const progressValue = 75;

  return (
    <div className="pb-24 px-4 pt-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#06D6A0] via-[#FF8C42] to-[#FFA55C] flex items-center justify-center shadow-[0_0_24px_rgba(6,214,160,0.4)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
            <Book className="w-6 h-6 text-white relative z-10" />
          </div>
          <h1 className="text-2xl font-bold text-white/95">StudyTracker</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <GlassCard className="px-3 py-2">
            <button className="flex items-center gap-2 text-sm text-white/90">
              <span>React.js</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </GlassCard>
          
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EF476F] via-[#f85e81] to-[#FFD166] flex items-center justify-center text-white font-bold shadow-[0_0_24px_rgba(239,71,111,0.4)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
            <span className="relative z-10">A</span>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="mb-6">
        <p className="text-white/60 text-lg">Ready to learn, Alex?</p>
      </div>

      {/* Progress Card */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg text-white/95 mb-1">Your Progress</h3>
            <p className="text-sm text-white/50">Level 4 - Master</p>
          </div>
          <div className="text-3xl font-bold text-[#06D6A0] drop-shadow-[0_0_12px_rgba(6,214,160,0.6)]">{progressValue}%</div>
        </div>
        
        <Progress.Root 
          value={progressValue} 
          className="relative h-3 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
        >
          <Progress.Indicator
            className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{
              width: `${progressValue}%`,
              background: 'linear-gradient(90deg, #06D6A0 0%, #FF8C42 100%)',
              boxShadow: '0 0 20px rgba(6, 214, 160, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
          </Progress.Indicator>
        </Progress.Root>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={index} className="p-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${stat.color}30 0%, ${stat.color}10 100%)`,
                  boxShadow: `0 0 20px ${stat.color}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                <Icon className="w-6 h-6 relative z-10" style={{ color: stat.color, filter: 'drop-shadow(0 0 8px currentColor)' }} />
              </div>
              <div className="text-2xl font-bold text-white/95 mb-1">{stat.value}</div>
              <div className="text-xs text-white/50 uppercase tracking-wide">{stat.label}</div>
            </GlassCard>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mb-4">
        <h3 className="text-lg text-white/95 mb-3">Recent Activity</h3>
        <GlassCard className="p-4">
          <div className="space-y-3">
            {[
              { title: 'Completed React Hooks Tutorial', time: '2 hours ago', color: '#06D6A0' },
              { title: 'Studied TypeScript Basics', time: '5 hours ago', color: '#FF8C42' },
              { title: 'Read Documentation', time: 'Yesterday', color: '#FFD166' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div 
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ 
                    backgroundColor: activity.color,
                    boxShadow: `0 0 12px ${activity.color}, 0 0 24px ${activity.color}80`
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm text-white/90">{activity.title}</p>
                  <p className="text-xs text-white/50">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}