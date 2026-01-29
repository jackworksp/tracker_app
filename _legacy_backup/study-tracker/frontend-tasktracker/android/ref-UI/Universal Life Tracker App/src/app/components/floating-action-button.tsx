import { Plus, ListTodo, Eye, BookOpen, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingActionButtonProps {
  onAddTask: (type: string) => void;
}

export function FloatingActionButton({ onAddTask }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const speedDialOptions = [
    { icon: ListTodo, label: 'Task', type: 'task', color: '#06D6A0' },
    { icon: Eye, label: 'Watch', type: 'watch', color: '#EF476F' },
    { icon: BookOpen, label: 'Read', type: 'read', color: '#FF8C42' },
    { icon: FileText, label: 'Note', type: 'note', color: '#FFD166' },
  ];

  const handleOptionClick = (type: string) => {
    onAddTask(type);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 space-y-3 mb-2"
          >
            {speedDialOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.type}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20, 
                    scale: 0.8,
                    transition: { delay: (speedDialOptions.length - index - 1) * 0.05 }
                  }}
                  onClick={() => handleOptionClick(option.type)}
                  className="flex items-center gap-3 group"
                >
                  {/* Label */}
                  <div className="px-3 py-1.5 rounded-lg bg-[#0A0E27]/95 backdrop-blur-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm text-[#F8F9FA] whitespace-nowrap">
                      {option.label}
                    </span>
                  </div>

                  {/* Icon Button */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: `${option.color}20`,
                      border: `2px solid ${option.color}`,
                      boxShadow: `0 4px 20px ${option.color}40`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: option.color }} />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ rotate: isOpen ? 45 : 0 }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-[#06D6A0] to-[#FF8C42] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all relative overflow-hidden"
        style={{
          boxShadow: '0 4px 24px rgba(6, 214, 160, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
        <Plus className="w-7 h-7 text-white relative z-10" />
      </motion.button>
    </div>
  );
}