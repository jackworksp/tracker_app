import React, { createContext, useContext, useState, useEffect } from 'react';
import TimeboxNative from '../native/TimeboxPlugin';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState({
    isActive: false,
    platform: null,
    duration: 0, // in minutes
    startTime: null,
    goal: '',
    timeRemaining: 0, // in seconds
  });

  useEffect(() => {
    let interval = null;
    if (session.isActive && session.timeRemaining > 0) {
      interval = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);
    } else if (session.timeRemaining === 0 && session.isActive) {
      // Timer finished
      clearInterval(interval);
      setSession((prev) => ({ ...prev, isActive: false }));
      // TODO: Trigger completion logic (e.g., show summary, close app)
      alert('Time is up!'); 
    }
    return () => clearInterval(interval);
  }, [session.isActive, session.timeRemaining]);

  const startSession = async (platform, duration, goal) => {
    try {
      // Check/Request permissions first
      await TimeboxNative.requestPermissions();
      
      await TimeboxNative.startOverlay({ duration, goal });
      
      setSession({
        isActive: true,
        platform,
        duration,
        startTime: Date.now(),
        goal,
        timeRemaining: duration * 60,
      });
    } catch (e) {
      console.error("Failed to start native session", e);
      alert("Note: Native overlay failed to start (are you on Web?). Session started in browser mode.");
      
      // Fallback start
      setSession({
        isActive: true,
        platform,
        duration,
        startTime: Date.now(),
        goal,
        timeRemaining: duration * 60,
      });
    }
  };

  const stopSession = async () => {
    try {
      await TimeboxNative.stopOverlay();
    } catch (e) {
      console.warn("Failed to stop overlay", e);
    }
    setSession((prev) => ({ ...prev, isActive: false }));
  };

  return (
    <SessionContext.Provider value={{ session, startSession, stopSession }}>
      {children}
    </SessionContext.Provider>
  );
};
