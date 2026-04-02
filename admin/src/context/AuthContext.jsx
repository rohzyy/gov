import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    
    if (token) {
      setUser({ token, role, name });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/login`, credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('name', data.name);
    setUser({ token: data.token, role: data.role, name: data.name });
    return data;
  };

  const register = async (userData) => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/register`, userData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    setUser(null);
  };

  const updateUser = (newData) => {
    setUser(newData);
    if (newData.name) localStorage.setItem('name', newData.name);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
