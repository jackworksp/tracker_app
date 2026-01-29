import { GlassCard } from '@/app/components/glass-card';
import { Calendar, Edit2, Trash2, RotateCcw, Youtube, Instagram, Play, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Session {
  id: string;
  date: Date;
  duration: number; // in minutes
  title: string;
  url?: string;
  topics: string[];
  type: 'Study' | 'Watch' | 'Read' | 'Course';
  revisionCount: number;
  platform?: 'youtube' | 'instagram'; // Platform identifier
  thumbnail?: string; // Thumbnail URL
}

export function Timesheet() {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      date: new Date('2026-01-15T14:30:00'),
      duration: 45,
      title: 'JavaScript Pro Tips & Best Practices',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      topics: ['JavaScript', 'Best Practices', 'Clean Code'],
      type: 'Watch',
      revisionCount: 2,
      platform: 'youtube',
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=450&fit=crop',
    },
    {
      id: '2',
      date: new Date('2026-01-15T13:00:00'),
      duration: 25,
      title: 'UI Design Trends 2026',
      url: 'https://instagram.com/p/example123',
      topics: ['Design', 'UI', 'Trends', 'Inspiration'],
      type: 'Read',
      revisionCount: 0,
      platform: 'instagram',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=800&fit=crop',
    },
    {
      id: '3',
      date: new Date('2026-01-15T10:00:00'),
      duration: 90,
      title: 'Advanced React Patterns Tutorial',
      url: 'https://youtube.com/watch?v=example456',
      topics: ['React', 'Patterns', 'Advanced', 'Hooks'],
      type: 'Watch',
      revisionCount: 1,
      platform: 'youtube',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    },
    {
      id: '4',
      date: new Date('2026-01-14T16:00:00'),
      duration: 15,
      title: 'Mobile App Animation Examples',
      url: 'https://instagram.com/p/anim789',
      topics: ['Animation', 'Mobile', 'UX'],
      type: 'Read',
      revisionCount: 3,
      platform: 'instagram',
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=800&fit=crop',
    },
    {
      id: '5',
      date: new Date('2026-01-14T14:00:00'),
      duration: 60,
      title: 'CSS Grid Layout Documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout',
      topics: ['CSS', 'Grid', 'Layout'],
      type: 'Read',
      revisionCount: 1,
    },
    {
      id: '6',
      date: new Date('2026-01-14T09:00:00'),
      duration: 120,
      title: 'Node.js Masterclass - Building REST APIs',
      url: 'https://youtube.com/watch?v=nodejs101',
      topics: ['Node.js', 'Backend', 'API', 'Express'],
      type: 'Watch',
      revisionCount: 0,
      platform: 'youtube',
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop',
    },
    {
      id: '7',
      date: new Date('2026-01-13T11:00:00'),
      duration: 180,
      title: 'Complete TypeScript Course',
      topics: ['TypeScript', 'Generics', 'Types'],
      type: 'Course',
      revisionCount: 2,
    },
  ]);

  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const incrementRevision = (id: string) => {
    setAnimatingId(id);
    setSessions(sessions.map(session =>
      session.id === id
        ? { ...session, revisionCount: session.revisionCount + 1 }
        : session
    ));
    setTimeout(() => setAnimatingId(null), 300);
  };

  const deleteSession = (id: string) => {
    setSessions(sessions.filter(session => session.id !== id));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, month };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Watch': return '#EF476F';
      case 'Read': return '#FF8C42';
      case 'Study': return '#06D6A0';
      case 'Course': return '#FFD166';
      default: return '#ADB5BD';
    }
  };

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);

  return (
    <div className="pb-24 px-4 pt-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/95 mb-2">Timesheet</h1>
        <p className="text-sm text-white/60">
          Total: {totalHours}h {totalMinutes % 60}m • {sessions.length} sessions
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {sessions.map((session) => {
          const { day, month } = formatDate(session.date);
          
          return (
            <GlassCard key={session.id} className="p-4">
              <div className="flex gap-4">
                {/* Date Box */}
                <div className="flex-shrink-0">
                  <div className="w-16 text-center">
                    <div className="text-3xl font-bold text-white/95">{day}</div>
                    <div className="text-xs text-white/50 uppercase">{month}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Duration Badge & Platform Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold relative overflow-hidden"
                      style={{
                        backgroundColor: `${getTypeColor(session.type)}20`,
                        color: getTypeColor(session.type),
                        border: `1px solid ${getTypeColor(session.type)}40`,
                        boxShadow: `0 0 16px ${getTypeColor(session.type)}30`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
                      <Calendar className="w-3 h-3 relative z-10" />
                      <span className="relative z-10">{formatDuration(session.duration)}</span>
                    </div>

                    {/* Platform Badge */}
                    {session.platform === 'youtube' && (
                      <div 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold relative overflow-hidden"
                        style={{
                          backgroundColor: 'rgba(255, 0, 0, 0.2)',
                          color: '#FF0000',
                          border: '1px solid rgba(255, 0, 0, 0.4)',
                          boxShadow: '0 0 16px rgba(255, 0, 0, 0.3)'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
                        <Youtube className="w-3 h-3 relative z-10" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                        <span className="relative z-10">YouTube</span>
                      </div>
                    )}

                    {session.platform === 'instagram' && (
                      <div 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, rgba(131, 58, 180, 0.2) 0%, rgba(253, 29, 29, 0.2) 50%, rgba(252, 176, 69, 0.2) 100%)',
                          color: '#E1306C',
                          border: '1px solid rgba(225, 48, 108, 0.4)',
                          boxShadow: '0 0 16px rgba(225, 48, 108, 0.3)'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
                        <Instagram className="w-3 h-3 relative z-10" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                        <span className="relative z-10">Instagram</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 
                    className={`mb-2 ${session.url ? 'text-[#FF8C42]' : 'text-white/90'}`}
                    style={session.url ? { filter: 'drop-shadow(0 0 8px currentColor)' } : {}}
                  >
                    {session.title}
                  </h3>

                  {/* Thumbnail Preview - YouTube & Instagram */}
                  {session.thumbnail && (session.platform === 'youtube' || session.platform === 'instagram') && (
                    <a 
                      href={session.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block mb-3 group"
                    >
                      <div 
                        className="relative rounded-2xl overflow-hidden"
                        style={{
                          aspectRatio: session.platform === 'youtube' ? '16/9' : '1/1',
                        }}
                      >
                        {/* Thumbnail Image */}
                        <img 
                          src={session.thumbnail} 
                          alt={session.title}
                          className="w-full h-full object-cover"
                        />

                        {/* Gradient Overlay */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: session.platform === 'youtube' 
                              ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' 
                              : 'linear-gradient(135deg, rgba(131, 58, 180, 0.3) 0%, rgba(253, 29, 29, 0.3) 50%, rgba(252, 176, 69, 0.3) 100%)'
                          }}
                        />

                        {/* Platform Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div 
                            className="relative overflow-hidden flex items-center justify-center"
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: session.platform === 'youtube' ? '50%' : '20px',
                              backgroundColor: session.platform === 'youtube' ? 'rgba(255, 0, 0, 0.95)' : 'rgba(225, 48, 108, 0.95)',
                              boxShadow: session.platform === 'youtube' 
                                ? '0 0 30px rgba(255, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)' 
                                : '0 0 30px rgba(225, 48, 108, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
                              backdropFilter: 'blur(10px)',
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                            {session.platform === 'youtube' ? (
                              <Play 
                                className="w-8 h-8 text-white relative z-10 ml-1" 
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} 
                              />
                            ) : (
                              <ExternalLink 
                                className="w-7 h-7 text-white relative z-10" 
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} 
                              />
                            )}
                          </div>
                        </div>

                        {/* Duration Badge (YouTube only) */}
                        {session.platform === 'youtube' && (
                          <div 
                            className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-bold text-white backdrop-blur-sm"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            }}
                          >
                            {formatDuration(session.duration)}
                          </div>
                        )}

                        {/* Platform Watermark */}
                        <div className="absolute top-2 right-2">
                          {session.platform === 'youtube' ? (
                            <div 
                              className="p-1.5 rounded-lg backdrop-blur-md"
                              style={{
                                backgroundColor: 'rgba(255, 0, 0, 0.9)',
                                boxShadow: '0 2px 8px rgba(255, 0, 0, 0.4)',
                              }}
                            >
                              <Youtube className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                            </div>
                          ) : (
                            <div 
                              className="p-1.5 rounded-lg backdrop-blur-md"
                              style={{
                                background: 'linear-gradient(135deg, rgba(131, 58, 180, 0.95) 0%, rgba(253, 29, 29, 0.95) 50%, rgba(252, 176, 69, 0.95) 100%)',
                                boxShadow: '0 2px 8px rgba(225, 48, 108, 0.4)',
                              }}
                            >
                              <Instagram className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  )}

                  {/* Topics */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {session.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/70 border border-white/20 backdrop-blur-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Revision Button */}
                    <button
                      onClick={() => incrementRevision(session.id)}
                      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#06D6A0]/20 border border-[#06D6A0]/40 hover:bg-[#06D6A0]/30 transition-all overflow-hidden"
                      style={{ boxShadow: '0 0 16px rgba(6,214,160,0.2)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
                      <RotateCcw className="w-4 h-4 text-[#06D6A0] relative z-10" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={session.revisionCount}
                          initial={{ y: animatingId === session.id ? -10 : 0, opacity: animatingId === session.id ? 0 : 1 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 10, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-sm font-semibold text-[#06D6A0] relative z-10"
                        >
                          {session.revisionCount}
                        </motion.span>
                      </AnimatePresence>
                    </button>

                    {/* Edit & Delete */}
                    <button
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-[#EF476F]" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}