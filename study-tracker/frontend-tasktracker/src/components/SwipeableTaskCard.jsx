
import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const SwipeableTaskCard = ({ children, onComplete, isCompleted }) => {
    const x = useMotionValue(0);
    const containerRef = useRef(null);

    // Transform values for animations
    const backgroundOpacity = useTransform(x, [0, 50, 120], [0, 0.5, 1]);
    const iconScale = useTransform(x, [0, 80], [0.8, 1.2]);
    const iconOpacity = useTransform(x, [0, 20], [0, 1]);
    
    // Only allow swipe if not already completed
    const dragConstraints = isCompleted ? { left: 0, right: 0 } : { left: 0, right: 300 };

    const handleDragEnd = (event, info) => {
        if (info.offset.x > 120 && !isCompleted) {
            // Trigger completion
            onComplete();
            // Snap back for visual feedback after completion
            animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        } else {
            // Snap back if threshold not reached
            animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        }
    };

    return (
        <div className="swipe-container" ref={containerRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', marginBottom: '1rem' }}>
            {/* Background Layer (Success Indicator) */}
            <motion.div 
                className="swipe-background"
                style={{ 
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(90deg, rgba(6,214,160,0.3) 0%, rgba(6,214,160,0.15) 100%)',
                    border: '1px solid rgba(6,214,160,0.4)',
                    boxShadow: '0 0 30px rgba(6,214,160,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                    zIndex: 0,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '2rem',
                    opacity: backgroundOpacity,
                    borderRadius: '16px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.div 
                        style={{ 
                            scale: iconScale, 
                            opacity: iconOpacity,
                            width: '3.5rem',
                            height: '3.5rem',
                            borderRadius: '1rem',
                            background: 'linear-gradient(135deg, rgba(6,214,160,0.4) 0%, rgba(6,214,160,0.2) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(6,214,160,0.6)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Inner shine effect */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.2))' }} />
                        <CheckCircle2 size={32} color="#06D6A0" strokeWidth={3} style={{ filter: 'drop-shadow(0 0 12px currentColor)', position: 'relative', zIndex: 10 }} />
                    </motion.div>
                    
                    <div>
                        <motion.p 
                            style={{ 
                                color: '#F8F9FA', 
                                fontWeight: '600', 
                                fontSize: '1.125rem',
                                margin: 0,
                                opacity: iconOpacity
                            }}
                        >
                            Complete
                        </motion.p>
                        <motion.p 
                            style={{ 
                                color: '#06D6A0', 
                                fontSize: '0.875rem',
                                margin: 0,
                                opacity: iconOpacity,
                                filter: 'drop-shadow(0 0 6px currentColor)'
                            }}
                        >
                            Release to mark as done
                        </motion.p>
                    </div>
                </div>
            </motion.div>

            {/* Foreground Card (Draggable) */}
            <motion.div
                className="swipe-foreground"
                style={{ x, position: 'relative', zIndex: 1, touchAction: 'pan-y' }}
                drag={isCompleted ? false : "x"}
                dragConstraints={dragConstraints}
                dragElastic={0.1} // Resistance feel
                onDragEnd={handleDragEnd}
                whileTap={{ scale: 0.98 }}
            >
                {children}

                {/* Hint Text (Only visible if not completed) */}
                {!isCompleted && (
                    <div className="swipe-hint" style={{ 
                        position: 'absolute', 
                        bottom: '8px', 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.3)',
                        pointerEvents: 'none',
                        opacity: 0.8
                    }}>
                        Swipe right to complete →
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SwipeableTaskCard;
