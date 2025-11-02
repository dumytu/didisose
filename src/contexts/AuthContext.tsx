import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email?: string;
  student_id?: string;
  role: 'student' | 'admin' | 'counselor' | 'librarian';
  name: string;
  date_of_birth?: string;
  class?: string;
  roll_number?: string;
  contact_number?: string;
  address?: string;
  parent_contact?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { studentId?: string; dateOfBirth?: string; email?: string; password?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isCounselor: boolean;
  isStudent: boolean;
  isLibrarian: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('sose_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('sose_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { studentId?: string; dateOfBirth?: string; email?: string; password?: string }): Promise<boolean> => {
    try {
      let query = supabase.from('users').select('*');

      if (credentials.studentId && credentials.dateOfBirth) {
        // Student login
        const formattedDOB = credentials.dateOfBirth.slice(0, 4) + '-' + 
          credentials.dateOfBirth.slice(4, 6) + '-' + credentials.dateOfBirth.slice(6, 8);
        
        query = query.eq('student_id', credentials.studentId).eq('date_of_birth', formattedDOB);
      } else if (credentials.email) {
        // Admin/Counselor/Librarian login
        query = query.eq('email', credentials.email);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return false;
      }

      // In a real app, you'd verify the password hash here
      // For demo purposes, we'll just check if it exists
      if (!data.password_hash) {
        return false;
      }

      const userData: User = {
        id: data.id,
        email: data.email,
        student_id: data.student_id,
        role: data.role,
        name: data.name,
        date_of_birth: data.date_of_birth,
        class: data.class,
        roll_number: data.roll_number,
        contact_number: data.contact_number,
        address: data.address,
        parent_contact: data.parent_contact,
        is_active: data.is_active
      };

      setUser(userData);
      localStorage.setItem('sose_user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('sose_user');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isCounselor: user?.role === 'counselor',
    isStudent: user?.role === 'student',
    isLibrarian: user?.role === 'librarian'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};