import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import api from '../api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsCheckingAuth(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('Found auth token, verifying...');
        try {
          const userData = await api.auth.getCurrentUser();
          if (userData) {
            console.log('Session verified for:', userData.name);
            setUser(userData);
            // Ensure local storage is in sync
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            console.warn('Token valid but user data fetch failed');
            handleLogout();
          }
        } catch (err) {
          console.error('Token verification failed:', err);
          handleLogout();
        }
      } else {
        console.log('No auth token found');
        handleLogout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      handleLogout();
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const login = useCallback(async (credentials) => {
    const response = await api.auth.login(credentials);
    const userData = response.user;
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    message.success(`Welcome back, ${userData.name}!`);
    // Async RAG sync — fire-and-forget, runs in background after login
    api.ask.syncEmbeddings().catch(() => {});
    return userData;
  }, []);

  const signup = useCallback(async (userData) => {
    const response = await api.auth.signup(userData);
    const newUser = response.user;
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    message.success(`Welcome to Vela, ${newUser.name}!`);
    // Async RAG sync — fire-and-forget, runs in background after signup
    api.ask.syncEmbeddings().catch(() => {});
    return newUser;
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    message.info('Logged out successfully');
  }, []);

  return (
    <UserContext.Provider value={{ user, isCheckingAuth, login, signup, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}
