'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Perfil } from '@/types/database.types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();
  const supabase = createClient();

  // Initialize theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('maintai_theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('maintai_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  const loadUserProfile = useCallback(async (currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (error || !data) {
        // User has no profile in perfiles
        await supabase.auth.signOut();
        setUser(null);
        setPerfil(null);
        router.push('/login?error=no_perfil');
        return;
      }

      if (!data.activo) {
        // User profile is inactive
        await supabase.auth.signOut();
        setUser(null);
        setPerfil(null);
        router.push('/login?error=inactivo');
        return;
      }

      setPerfil(data as Perfil);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
    }
  }, [supabase, router]);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
          if (user) {
            await loadUserProfile(user.id);
          }
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadUserProfile(currentUser.id);
      } else {
        setPerfil(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserProfile]);

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setIsLoading(false);
    router.push('/login');
  };

  const refreshPerfil = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const isAdmin = perfil?.rol === 'admin';
  const isSupervisor = perfil?.rol === 'supervisor' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        isLoading,
        isAdmin,
        isSupervisor,
        theme,
        toggleTheme,
        signOut,
        refreshPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
