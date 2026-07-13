import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token with axios headers
  const setSession = (token, userData) => {
    if (token) {
      setAccessToken(token);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      setAccessToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('user');
    }
  };

  // Attempt refresh token on startup to maintain session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          // Verify session by calling refresh endpoint
          const response = await api.post('/auth/refresh');
          const { accessToken: token, user: userData } = response.data;
          setSession(token, userData);
        }
      } catch (error) {
        console.error('Session restore failed, user must log in again');
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to token refresh errors from axios interceptors
    const handleLogoutTrigger = () => {
      setSession(null);
    };

    window.addEventListener('auth-logout', handleLogoutTrigger);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutTrigger);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken: token, user: userData } = response.data;
      setSession(token, userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { accessToken: token, user: userData } = response.data;
      setSession(token, userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setSession(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.patch('/users/me', profileData);
      const { user: updatedUser } = response.data;
      setSession(accessToken, updatedUser);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
