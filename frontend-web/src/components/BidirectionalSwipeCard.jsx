import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Trash2, CheckCircle2 } from 'lucide-react';

const BidirectionalSwipeCard = ({
    children,
    onSwipeRight,
    onSwipeLeft,
    rightConfig = null,
    leftConfig = null,
    disabled = false
}) => {
    const x = useMotionValue(0);
    const containerRef = useRef(null);

    // Default configurations
    const defaultRightConfig = {
        threshold: 120,
        color: '#ef4444',
        gradient: 'linear-gradient(90deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.15) 100%)',
        border: '1px solid rgba(239,68,68,0.4)',
        boxShadow: '0 0 30px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        icon: Trash2,
        text: 'Delete',
        subtext: 'Release to delete'
    };

    const defaultLeftConfig = {
        threshold: 120,
        color: '#06D6A0',
        gradient: 'linear-gradient(270deg, rgba(6,214,160,0.3) 0%, rgba(6,214,160,0.15) 100%)',
        border: '1px solid rgba(6,214,160,0.4)',
        boxShadow: '0 0 30px rgba(6,214,160,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        icon: CheckCircle2,
        text: 'Complete',
        subtext: 'Release to mark as done'
    };

    const right = rightConfig || (onSwipeRight ? defaultRightConfig : null);
    const left = leftConfig || (onSwipeLeft ? defaultLeftConfig : null);

    // Transform values for right swipe
    const rightBackgroundOpacity = right ? useTransform(
        x,
        [0, 50, right.threshold],
        [0, 0.5, 1]
    ) : useMotionValue(0);
    const rightIconScale = right ? useTransform(x, [0, 80], [0.8, 1.2]) : useMotionValue(0);
    const rightIconOpacity = right ? useTransform(x, [0, 20], [0, 1]) : useMotionValue(0);

    // Transform values for left swipe
    const leftBackgroundOpacity = left ? useTransform(
        x,
        [0, -50, -left.threshold],
        [0, 0.5, 1]
    ) : useMotionValue(0);
    const leftIconScale = left ? useTransform(x, [0, -80], [0.8, 1.2]) : useMotionValue(0);
    const leftIconOpacity = left ? useTransform(x, [0, -20], [0, 1]) : useMotionValue(0);

    // Drag constraints
    const dragConstraints = {
        left: left ? -300 : 0,
        right: right ? 300 : 0
    };

    const handleDragEnd = (event, info) => {
        // Check right swipe
        if (right && info.offset.x > right.threshold && onSwipeRight) {
            onSwipeRight();
            animate(x, 400, { duration: 0.2 });
        }
        // Check left swipe
        else if (left && info.offset.x < -left.threshold && onSwipeLeft) {
            onSwipeLeft();
            animate(x, -400, { duration: 0.2 });
        }
        // Snap back if threshold not reached
        else {
            animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        }
    };

    const RightIcon = right?.icon;
    const LeftIcon = left?.icon;

    return (
        <div
            className="swipe-container"
            ref={containerRef}
            style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '20px',
                marginBottom: '1rem'
            }}
        >
            {/* Right Background Layer (Delete/Custom Action) */}
            {right && (
                <motion.div
                    className="swipe-background-right"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: right.gradient,
                        border: right.border,
                        boxShadow: right.boxShadow,
                        zIndex: 0,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '2rem',
                        opacity: rightBackgroundOpacity,
                        borderRadius: '16px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <motion.div
                            style={{
                                scale: rightIconScale,
                                opacity: rightIconOpacity,
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '1rem',
                                background: `linear-gradient(135deg, ${right.color}66 0%, ${right.color}33 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 0 20px ${right.color}99`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.2))' }} />
                            {RightIcon && <RightIcon size={32} color={right.color} strokeWidth={3} style={{ filter: 'drop-shadow(0 0 12px currentColor)', position: 'relative', zIndex: 10 }} />}
                        </motion.div>

                        <div>
                            <motion.p
                                style={{
                                    color: '#F8F9FA',
                                    fontWeight: '600',
                                    fontSize: '1.125rem',
                                    margin: 0,
                                    opacity: rightIconOpacity
                                }}
                            >
                                {right.text}
                            </motion.p>
                            <motion.p
                                style={{
                                    color: right.color,
                                    fontSize: '0.875rem',
                                    margin: 0,
                                    opacity: rightIconOpacity,
                                    filter: 'drop-shadow(0 0 6px currentColor)'
                                }}
                            >
                                {right.subtext}
                            </motion.p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Left Background Layer (Complete/Custom Action) */}
            {left && (
                <motion.div
                    className="swipe-background-left"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: left.gradient,
                        border: left.border,
                        boxShadow: left.boxShadow,
                        zIndex: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '2rem',
                        opacity: leftBackgroundOpacity,
                        borderRadius: '16px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div>
                            <motion.p
                                style={{
                                    color: '#F8F9FA',
                                    fontWeight: '600',
                                    fontSize: '1.125rem',
                                    margin: 0,
                                    opacity: leftIconOpacity,
                                    textAlign: 'right'
                                }}
                            >
                                {left.text}
                            </motion.p>
                            <motion.p
                                style={{
                                    color: left.color,
                                    fontSize: '0.875rem',
                                    margin: 0,
                                    opacity: leftIconOpacity,
                                    filter: 'drop-shadow(0 0 6px currentColor)',
                                    textAlign: 'right'
                                }}
                            >
                                {left.subtext}
                            </motion.p>
                        </div>

                        <motion.div
                            style={{
                                scale: leftIconScale,
                                opacity: leftIconOpacity,
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '1rem',
                                background: `linear-gradient(135deg, ${left.color}66 0%, ${left.color}33 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 0 20px ${left.color}99`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.2))' }} />
                            {LeftIcon && <LeftIcon size={32} color={left.color} strokeWidth={3} style={{ filter: 'drop-shadow(0 0 12px currentColor)', position: 'relative', zIndex: 10 }} />}
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {/* Foreground Card (Draggable) */}
            <motion.div
                className="swipe-foreground"
                style={{ x, position: 'relative', zIndex: 1, touchAction: 'pan-y' }}
                drag={disabled ? false : "x"}
                dragConstraints={dragConstraints}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                whileTap={{ scale: 0.98 }}
            >
                {/* Swipe affordance edge hints - fade out as card moves */}
                {right && !disabled && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            opacity: useTransform(x, [0, 30], [0.25, 0]),
                            pointerEvents: 'none',
                            zIndex: 2,
                            color: right.color,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {RightIcon && <RightIcon size={14} />}
                    </motion.div>
                )}
                {left && !disabled && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            opacity: useTransform(x, [0, -30], [0.25, 0]),
                            pointerEvents: 'none',
                            zIndex: 2,
                            color: left.color,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {LeftIcon && <LeftIcon size={14} />}
                    </motion.div>
                )}
                {children}
            </motion.div>
        </div>
    );
};

export default BidirectionalSwipeCard;
