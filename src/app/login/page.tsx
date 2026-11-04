'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Cpu, AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    if (errorParam === 'no_perfil') {
      return 'Sin acceso. Tu usuario no tiene un perfil registrado en el panel. Contacta al administrador.';
    }
    if (errorParam === 'inactivo') {
      return 'Acceso denegado. Tu perfil se encuentra inactivo. Contacta al administrador.';
    }
    return null;
  });

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Correo o contraseña incorrectos. Verifica tus credenciales.');
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Verify active profile
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('id, activo, rol')
          .eq('id', data.user.id)
          .single();

        if (perfilError || !perfil) {
          await supabase.auth.signOut();
          setErrorMsg('Sin acceso. Tu usuario no tiene un perfil asignado en MaintAI. Contacta al administrador.');
          setIsLoading(false);
          return;
        }

        if (!perfil.activo) {
          await supabase.auth.signOut();
          setErrorMsg('Acceso denegado. Tu perfil se encuentra desactivado.');
          setIsLoading(false);
          return;
        }

        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Error inesperado al iniciar sesión.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[390px] sm:max-w-[430px] select-none">
      {/* Brand Logo Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
            <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Maint<span className="text-blue-600 dark:text-blue-400">AI</span>
          </span>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Vaporsur Energía · Planta de Cogeneración
        </p>
      </div>

      {/* Modern Card */}
      <Card className="shadow-modal border-slate-200/90 dark:border-slate-800">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ingresa tus credenciales institucionales para acceder al sistema
            </p>
          </div>

          {/* Error notification */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs animate-slide-in-up"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Email input group */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@vaporsur.com"
                  className="modern-input pr-10 py-2.5"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password input group */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="modern-input pr-10 py-2.5"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between pt-1">
              <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Recordarme</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2 font-semibold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ingresar a la Plataforma
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>¿Problemas para acceder a tu cuenta?</p>
            <p className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-1">
              Contactar al Administrador de Planta
            </p>
          </div>
        </CardContent>

        <CardFooter className="justify-center text-center py-3 text-[11px] text-slate-400">
          Refinería Bahía Norte · Supervisión de Activos
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#090d16]">
      <Suspense fallback={<div className="text-xs text-slate-400">Cargando acceso...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}