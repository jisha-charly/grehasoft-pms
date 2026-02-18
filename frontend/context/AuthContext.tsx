
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, role: UserRole) => {
    // Simulated JWT login logic mapping username to mock corporate credentials
    const mockUser: User = {
      id: Math.floor(Math.random() * 1000),
      name: username.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      username: username.toLowerCase(),
      email: `${username.toLowerCase()}@grehasoft.com`,
      role: role,
      departmentId: 1,
      status: 'active'
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
