import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthResponse, Role } from '../types/lab.types';
import { axiosClient } from '../api/axiosClient';

interface UserState {
  username: string;
  email: string;
  role: Role;
  token: string;
}

interface AuthContextType {
  user: UserState | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(() => {
    const savedToken = localStorage.getItem('labaudit_token');
    const savedUser = localStorage.getItem('labaudit_user');
    if (savedToken && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('labaudit_token', user.token);
      localStorage.setItem('labaudit_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('labaudit_token');
      localStorage.removeItem('labaudit_user');
    }
  }, [user]);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/login', { username, password });
    const authData = response.data;
    const userData: UserState = {
      username: authData.username,
      email: authData.email,
      role: authData.role,
      token: authData.token,
    };
    setUser(userData);
    return authData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('labaudit_token');
    localStorage.removeItem('labaudit_user');
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
