import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/apiService';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto restore session
//   useEffect(() => {
//     const savedToken = localStorage.getItem('bt_token');
//     const savedUser = localStorage.getItem('bt_user');

//     if (savedToken && savedUser) {
//       setToken(savedToken);
//       setUser(JSON.parse(savedUser));
//     }

//     setLoading(false);
//   }, []);
   useEffect(() => {
  const savedToken = localStorage.getItem('bt_token');
  const savedUser = localStorage.getItem('bt_user');

  if (savedToken && savedUser && savedUser !== 'undefined') {
    try {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('Invalid user in localStorage');
      localStorage.removeItem('bt_user');
      localStorage.removeItem('bt_token');
    }
  }

  setLoading(false);
}, []);

  const login = async (username: string, password: string) => {
  setLoading(true);

  try {
    const res = await api.login(username, password);

    setToken(res.access_token);
    setUser(res.safeUser);

    localStorage.setItem('bt_token', res.access_token);
    localStorage.setItem('bt_user', JSON.stringify(res.safeUser));
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    throw error; // 🔥 INI WAJIB supaya LoginPage bisa tangkap error
  } finally {
    setLoading(false);
  }
};

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bt_token');
    localStorage.removeItem('bt_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);