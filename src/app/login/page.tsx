'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Zap, AlertCircle, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

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
    <div className="w-full max-w-[380px] sm:max-w-[420px] select-none">
      {/* AdminLTE login-logo */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-[0.25rem] bg-[#007bff] text-white flex items-center justify-center font-black shadow-xs">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-3xl font-light text-[#212529] dark:text-[#f8f9fa]">
            Maint<b className="font-extrabold text-[#007bff]">AI</b>
            <span className="text-xs bg-[#007bff] text-white px-2 py-0.5 rounded font-bold uppercase ml-2 align-middle">
              LTE
            </span>
          </span>
        </div>
        <p className="text-xs font-semibold text-[#6c757d] dark:text-[#ced4da] uppercase tracking-wider">
          Vaporsur Energía S.A.C. · Refinería Bahía Norte
        </p>
      </div>

      {/* AdminLTE Card Outline Primary */}
      <div className="lte-card border-t-4 border-t-[#007bff] shadow-lte-md">
        <div className="p-6">
          <p className="text-center text-xs text-[#495057] dark:text-[#ced4da] font-medium mb-5">
            Ingrese sus credenciales para iniciar sesión
          </p>

          {/* Error notification */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-[0.25rem] bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb] flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#dc3545]" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Email input group */}
            <div>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo institucional..."
                  className="form-control-lte pr-10 py-2"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#adb5bd] pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password input group */}
            <div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña..."
                  className="form-control-lte pr-10 py-2"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#adb5bd] pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Remember me & Sign In */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[0.2rem] text-[#007bff] focus:ring-[#007bff] border-[#ced4da]"
                />
                <span className="text-xs text-[#6c757d] dark:text-[#ced4da]">Recordarme</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-lte-primary px-4 py-2 font-bold text-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[#dee2e6] dark:border-[#4b545c] text-center text-xs text-[#6c757d] dark:text-[#ced4da]">
            <p>¿Problemas para acceder a su cuenta?</p>
            <p className="font-semibold text-[#007bff] hover:underline cursor-pointer mt-0.5">
              Contactar al Administrador del Sistema
            </p>
          </div>
        </div>

        <div className="lte-card-footer text-center py-2 text-[11px] text-[#6c757d] dark:text-[#ced4da]">
          MaintAI LTE · Versión 3.4.0 Cogeneración
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#e9ecef] dark:bg-[#1a2226]">
      <Suspense fallback={<div className="text-xs text-[#6c757d]">Cargando acceso...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
