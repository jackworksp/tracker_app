import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const SecurityContext = createContext(null);

export const SecurityProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // Initialize security settings
  useEffect(() => {
    loadSecuritySettings();
  }, []);

  // Listen for app state changes (Background -> Foreground)
  useEffect(() => {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkLockDate();
      } else {
        // App went to background, set timestamp if security is enabled
        if (securityEnabled) {
          Preferences.set({
            key: 'last_background_time',
            value: Date.now().toString(),
          });
          // Immediately lock internally so next open requires auth
          setIsLocked(true); 
          setIsAuthenticated(false);
        }
      }
    });
  }, [securityEnabled]);

  const loadSecuritySettings = async () => {
    const enabled = await Preferences.get({ key: 'security_enabled' });
    const bioEnabled = await Preferences.get({ key: 'biometrics_enabled' });
    const storedPin = await Preferences.get({ key: 'app_pin' });

    setSecurityEnabled(enabled.value === 'true');
    setBiometricsEnabled(bioEnabled.value === 'true');
    setHasPin(!!storedPin.value);

    // Initial check: if enabled, lock app immediately
    if (enabled.value === 'true') {
      setIsLocked(true);
      setIsAuthenticated(false);
    }
  };

  const checkLockDate = async () => {
    if (!securityEnabled) return;

    // Logic: Always lock if security enabled and coming from background
    // We could add a "grace period" here if requested, but "at each time app opening" implies immediate.
    setIsLocked(true);
    setIsAuthenticated(false);
  };

  const verifyPin = async (inputPin) => {
    const storedPin = await Preferences.get({ key: 'app_pin' });
    if (storedPin.value === inputPin) {
      unlockApp();
      return true;
    }
    return false;
  };

  const setPin = async (newPin) => {
    await Preferences.set({ key: 'app_pin', value: newPin });
    setHasPin(true);
  };

  const enableSecurity = async (enable) => {
    await Preferences.set({ key: 'security_enabled', value: enable ? 'true' : 'false' });
    setSecurityEnabled(enable);
  };

  const enableBiometrics = async (enable) => {
    if (enable) {
      // Check if available first
      try {
        const result = await NativeBiometric.isAvailable();
        if (!result.isAvailable) {
          throw new Error('Biometrics not available');
        }
      } catch (e) {
        console.error('Biometrics check failed', e);
        return false;
      }
    }
    await Preferences.set({ key: 'biometrics_enabled', value: enable ? 'true' : 'false' });
    setBiometricsEnabled(enable);
    return true;
  };

  const unlockApp = () => {
    setIsLocked(false);
    setIsAuthenticated(true);
  };

  const promptBiometrics = async () => {
    if (!biometricsEnabled) return false;

    try {
      await NativeBiometric.performBiometricVerification({
        reason: "Unlock App",
        title: "Log in",
        subtitle: "Use Face ID or Fingerprint",
        description: "Please authenticate to access the app",
      });

      // performBiometricVerification throws on failure, resolves on success
      unlockApp();
      return true;
    } catch (error) {
      console.error('Biometric auth failed', error);
    }
    return false;
  };

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        isAuthenticated,
        securityEnabled,
        biometricsEnabled,
        hasPin,
        verifyPin,
        setPin,
        enableSecurity,
        enableBiometrics,
        unlockApp,
        promptBiometrics,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => useContext(SecurityContext);
