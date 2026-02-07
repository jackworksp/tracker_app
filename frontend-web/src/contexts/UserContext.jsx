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
      console.log('Clearing auth data to force fresh login');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const login = useCallback(async (credentials) => {
    const response = await api.auth.login(credentials);
    const userData = response.user;
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    message.success(`Welcome back, ${userData.name}!`);
    return userData;
  }, []);

  const signup = useCallback(async (userData) => {
    const response = await api.auth.signup(userData);
    const newUser = response.user;
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    message.success(`Welcome to Study Tracker, ${newUser.name}!`);
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
