import React, { useState, useEffect } from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { Lock, Fingerprint, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppLock = () => {
    const { isLocked, verifyPin, promptBiometrics, biometricsEnabled } = useSecurity();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (isLocked && biometricsEnabled) {
            setTimeout(() => promptBiometrics(), 300);
        }
    }, [isLocked, biometricsEnabled]);

    const handleNumberClick = (num) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) handleVerify(newPin);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleVerify = async (inputPin) => {
        const isValid = await verifyPin(inputPin);
        if (isValid) {
            setPin('');
            setError(false);
        } else {
            setError(true);
            setShake(true);
            setTimeout(() => { setPin(''); setShake(false); }, 500);
        }
    };

    if (!isLocked) return null;

    const s = {
        overlay: {
            position: 'fixed', inset: 0,
            backgroundColor: '#0A0E27',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'white',
        },
        icon: {
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, color: '#6B9FFF',
        },
        title: {
            fontSize: '1.5rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.95)', margin: '0 0 8px',
        },
        subtitle: {
            fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: 0,
        },
        dots: {
            display: 'flex', gap: 16, margin: '32px 0',
        },
        dot: (filled, err) => ({
            width: 14, height: 14, borderRadius: '50%',
            background: filled ? (err ? '#EF476F' : '#6B9FFF') : 'rgba(255,255,255,0.15)',
            transition: 'all 0.2s',
            transform: filled ? 'scale(1.1)' : 'scale(1)',
        }),
        numpad: {
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16, width: 240,
        },
        numBtn: {
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', fontSize: '1.4rem', fontWeight: 500,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', transition: 'background 0.15s',
        },
        iconBtn: {
            width: 72, height: 72, borderRadius: '50%',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', transition: 'background 0.15s',
        },
        error: {
            marginTop: 16, color: '#EF476F',
            fontSize: '0.875rem', fontWeight: 500,
        },
    };

    return (
        <div style={s.overlay}>
            <AnimatePresence>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                    <div style={s.icon}><Lock size={28} /></div>
                    <h2 style={s.title}>Enter PIN</h2>
                    <p style={s.subtitle}>Please enter your PIN to unlock</p>

                    {/* PIN Dots */}
                    <motion.div
                        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                        style={s.dots}
                    >
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} style={s.dot(i < pin.length, error)} />
                        ))}
                    </motion.div>

                    {/* Numpad */}
                    <div style={s.numpad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                style={s.numBtn}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onClick={() => handleNumberClick(num.toString())}
                            >
                                {num}
                            </button>
                        ))}

                        {/* Biometric or empty */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {biometricsEnabled && (
                                <button style={{ ...s.iconBtn, color: '#6B9FFF' }} onClick={promptBiometrics}>
                                    <Fingerprint size={28} />
                                </button>
                            )}
                        </div>

                        <button
                            style={s.numBtn}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onClick={() => handleNumberClick('0')}
                        >
                            0
                        </button>

                        <button style={s.iconBtn} onClick={handleDelete}>
                            <Delete size={22} />
                        </button>
                    </div>

                    {error && <p style={s.error}>Incorrect PIN</p>}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AppLock;
