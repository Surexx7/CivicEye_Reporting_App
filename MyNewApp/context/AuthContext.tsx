/**
 * CivicEye — Auth Context
 * File: context/AuthContext.tsx
 *
 * FIXES:
 *  1. Added `department` field to AuthContextType — staff_profile and
 *     staff_dashboard were destructuring it from useAuth() but it was
 *     never in the interface, so it was always undefined.
 *  2. department state stored separately and persisted via AsyncStorage.
 *  3. staffLogin correctly calls staffLoginUser() → /auth/staff-login/
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CivicUser,
  clearTokens,
  getAccessToken,
  getIsStaff,
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  staffLoginUser,
} from '../services/api';

const DEPT_KEY = 'civiceye_department';

interface AuthContextType {
  user:        CivicUser | null;
  isLoading:   boolean;
  isLoggedIn:  boolean;
  isStaff:     boolean;
  department:  string | null;           // ✅ FIX 1: was missing — always undefined before
  login:       (email: string, password: string) => Promise<void>;
  staffLogin:  (username: string, password: string) => Promise<void>;
  register:    (email: string, password: string, password2: string) => Promise<void>;
  logout:      () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,       setUser]       = useState<CivicUser | null>(null);
  const [isStaff,    setIsStaff]    = useState(false);
  const [department, setDepartment] = useState<string | null>(null);
  const [isLoading,  setLoading]    = useState(true);

  // Restore session on launch
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const [me, staff, dept] = await Promise.all([
            getMe(),
            getIsStaff(),
            AsyncStorage.getItem(DEPT_KEY),
          ]);
          setUser(me);
          setIsStaff(staff);
          setDepartment(dept);
        }
      } catch {
        await clearTokens();
        await AsyncStorage.removeItem(DEPT_KEY);
        setUser(null);
        setIsStaff(false);
        setDepartment(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Citizen login ─────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    setUser(res.user);
    setIsStaff(false);
    setDepartment(null);
    await AsyncStorage.removeItem(DEPT_KEY);
  };

  // ── Staff login ───────────────────────────────────────────────────────────
  const staffLogin = async (username: string, password: string) => {
    const res = await staffLoginUser(username, password);
    const dept = res.department ?? null;

    const enrichedUser: CivicUser = {
      ...res.user,
      is_staff:   true,
      department: dept ?? undefined,
    };

    setUser(enrichedUser);
    setIsStaff(true);
    setDepartment(dept);

    if (dept) await AsyncStorage.setItem(DEPT_KEY, dept);
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (email: string, password: string, password2: string) => {
    const res = await registerUser(email, password, password2);
    setUser(res.user);
    setIsStaff(false);
    setDepartment(null);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await logoutUser();
    await AsyncStorage.removeItem(DEPT_KEY);
    setUser(null);
    setIsStaff(false);
    setDepartment(null);
    // Navigation is handled by the route guard in _layout.tsx (see fix below)
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      isStaff,
      department,
      login,
      staffLogin,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}