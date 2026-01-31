import React, { useState } from 'react';
import { Plus, Clipboard, Youtube, BookOpen, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingActionButton = ({ onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);

  const speedDialOptions = [
    { icon: Clipboard, label: 'Task', type: 'TASK', color: '#06D6A0' },
    { icon: Youtube, label: 'Watch', type: 'WATCH', color: '#EF476F' },
    { icon: BookOpen, label: 'Read', type: 'READ', color: '#FF8C42' },
    { icon: StickyNote, label: 'Note', type: 'NOTE', color: '#FFD166' },
  ];

  const handleOptionClick = (type) => {
    onAddTask(type);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '96px', right: '24px', zIndex: 999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: '64px', right: '0', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}
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
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {/* Label */}
                  <div 
                    className="fab-label"
                    style={{ 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      background: 'rgba(10,14,39,0.95)', 
                      backdropFilter: 'blur(40px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: '#F8F9FA', whiteSpace: 'nowrap' }}>
                      {option.label}
                    </span>
                  </div>

                  {/* Icon Button */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${option.color}20`,
                      border: `2px solid ${option.color}`,
                      boxShadow: `0 4px 20px ${option.color}40`,
                      transition: 'transform 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Icon style={{ width: '20px', height: '20px', color: option.color }} />
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
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(to right, #06D6A0, #FF8C42)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(6, 214, 160, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 32px rgba(6, 214, 160, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 24px rgba(6, 214, 160, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.1))' }} />
        <Plus style={{ width: '28px', height: '28px', color: 'white', position: 'relative', zIndex: 10 }} />
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;
