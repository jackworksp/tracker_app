import { GlassCard } from '@/app/components/glass-card';
import { CheckCircle2, Circle, Clock, Bell, Edit2, Trash2, Play, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';

interface Task {
  id: string;
  type: 'WATCH' | 'READ' | 'TASK' | 'COURSE';
  title: string;
  thumbnail?: string;
  completed: boolean;
  url?: string;
}

interface TasksProps {
  onOpenModal: (taskId?: string) => void;
}

// Swipeable Task Card Component
interface SwipeableTaskCardProps {
  task: Task;
  onComplete: () => void;
  onOpenModal: () => void;
  onDelete: () => void;
  getTypeColor: (type: string) => string;
}

function SwipeableTaskCard({ task, onComplete, onOpenModal, onDelete, getTypeColor }: SwipeableTaskCardProps) {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  
  // Transform opacity based on swipe distance
  const opacity = useTransform(x, [0, 150], [0, 1]);
  const scale = useTransform(x, [0, 150], [0.8, 1]);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If swiped more than 120px to the right, complete the task
    if (info.offset.x > 120) {
      // Animate to full width then complete
      onComplete();
    }
    setSwiping(false);
  };

  const handleDragStart = () => {
    setSwiping(true);
  };

  return (
    <div className="relative">
      {/* Background - Success Indicator */}
      <motion.div 
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{ opacity }}
      >
        <div 
          className="h-full w-full flex items-center px-8 rounded-3xl backdrop-blur-3xl"
          style={{
            background: 'linear-gradient(90deg, rgba(6,214,160,0.3) 0%, rgba(6,214,160,0.15) 100%)',
            border: '1px solid rgba(6,214,160,0.4)',
            boxShadow: '0 0 30px rgba(6,214,160,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <motion.div
            style={{ scale }}
            className="flex items-center gap-3"
          >
            <div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06D6A0]/40 to-[#06D6A0]/20 flex items-center justify-center relative overflow-hidden"
              style={{ boxShadow: '0 0 20px rgba(6,214,160,0.6)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
              <CheckCircle2 className="w-8 h-8 text-[#06D6A0] relative z-10" style={{ filter: 'drop-shadow(0 0 12px currentColor)' }} />
            </div>
            <div>
              <p className="text-white/95 font-semibold text-lg">Complete</p>
              <p className="text-[#06D6A0] text-sm" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}>Release to mark as done</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Draggable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.2 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10"
      >
        <GlassCard className="overflow-hidden">
          {/* Header */}
          <div className="p-4 pb-3 flex items-center gap-3">
            <div 
              className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
              style={{
                color: getTypeColor(task.type),
                backgroundColor: `${getTypeColor(task.type)}20`,
                border: `1px solid ${getTypeColor(task.type)}40`
              }}
            >
              {task.type}
            </div>
          </div>

          {/* Thumbnail */}
          {task.thumbnail && (
            <div className="relative aspect-video mx-4 rounded-lg overflow-hidden mb-3">
              <img 
                src={task.thumbnail} 
                alt={task.title}
                className="w-full h-full object-cover"
              />
              {task.url && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="px-4 pb-3">
            <h3 className="text-white/90">{task.title}</h3>
            {task.url && (
              <p className="text-xs text-[#FF8C42] mt-1 truncate" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}>{task.url}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Circle className="w-4 h-4" />
              <span className="text-xs">Swipe right to complete →</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenModal}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Log Time"
              >
                <Clock className="w-5 h-5 text-white/60" />
              </button>
              <button
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Set Reminder"
              >
                <Bell className="w-5 h-5 text-white/60" />
              </button>
              <button
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-white/60" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-[#EF476F]" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export function Tasks({ onOpenModal }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      type: 'WATCH',
      title: 'React Hooks Complete Tutorial',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
      completed: false,
      url: 'https://youtube.com/watch?v=example',
    },
    {
      id: '2',
      type: 'READ',
      title: 'Understanding TypeScript Generics',
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop',
      completed: false,
      url: 'https://typescriptlang.org/docs',
    },
    {
      id: '3',
      type: 'TASK',
      title: 'Build a Todo App with React',
      completed: false,
    },
    {
      id: '4',
      type: 'COURSE',
      title: 'Advanced CSS Grid Layouts',
      thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop',
      completed: true,
      url: 'https://course.example.com',
    },
  ]);

  const toggleComplete = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WATCH': return '#EF476F';
      case 'READ': return '#FF8C42';
      case 'TASK': return '#06D6A0';
      case 'COURSE': return '#FFD166';
      default: return '#ADB5BD';
    }
  };

  const completedTasks = tasks.filter(t => t.completed);
  const activeTasks = tasks.filter(t => !t.completed);

  return (
    <div className="pb-24 px-4 pt-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/95 mb-2">Tasks</h1>
        <p className="text-sm text-white/60">
          {activeTasks.length} active • {completedTasks.length} completed
        </p>
      </div>

      {/* Active Tasks */}
      {activeTasks.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#06D6A0]/20 to-[#FF8C42]/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(6,214,160,0.3)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
            <CheckCircle2 className="w-8 h-8 text-[#06D6A0] relative z-10" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
          </div>
          <p className="text-white/90 mb-2">No tasks yet</p>
          <p className="text-sm text-white/50">Add your first task to get started</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {activeTasks.map((task) => (
            <SwipeableTaskCard
              key={task.id}
              task={task}
              onComplete={() => toggleComplete(task.id)}
              onOpenModal={() => onOpenModal(task.id)}
              onDelete={() => deleteTask(task.id)}
              getTypeColor={getTypeColor}
            />
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg text-white/60 mb-4">Completed</h2>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <GlassCard key={task.id} className="p-4 opacity-60">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="mt-1"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#06D6A0]" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                  </button>
                  <div className="flex-1">
                    <div 
                      className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase mr-2 mb-2"
                      style={{
                        color: getTypeColor(task.type),
                        backgroundColor: `${getTypeColor(task.type)}20`,
                      }}
                    >
                      {task.type}
                    </div>
                    <p className="text-white/70 line-through">{task.title}</p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-[#EF476F]" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}