import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));

  useEffect(() => {
    // Try to refresh token on app load if accessToken is missing
    if (!accessToken && refreshToken) {
      refresh();
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        setAccessToken(response.data.access_token);
        setRefreshToken(response.data.refresh_token);
        setUser(response.data.user);
        return response.data; // Return the response data on success
      }
    } catch (err) {
      console.error('Login failed', err);
      throw err; // Throw the error to be caught by the caller
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // Refresh token function
  const refresh = async () => {
    if (!refreshToken) return; // Prevent running if no refresh token

    try {
      const response = await api.post('/refresh', { refresh_token: refreshToken });
      if (response.data.success) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        setAccessToken(response.data.access_token);
        setRefreshToken(response.data.refresh_token);
      }
    } catch (err) {
      console.error('Failed to refresh token', err);
      logout(); // Logout only if refresh fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);