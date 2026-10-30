'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatFechaHoraLima } from '@/lib/utils';
import type { Perfil, RolUsuario } from '@/types/database.types';
import {
  UserCog,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  XCircle,
  Edit2,
  Info,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export default function UsuariosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPerfil, setSelectedPerfil] = useState<Perfil | null>(null);
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<RolUsuario>('supervisor');
  const [activo, setActivo] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadPerfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching perfiles:', error);
      } else {
        setPerfiles((data as Perfil[]) || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isAdmin) {
      loadPerfiles();
    }
  }, [isAdmin, loadPerfiles]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Acceso Restringido
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          La gestión de perfiles y usuarios del panel solo puede ser realizada por administradores.
        </p>
      </div>
    );
  }

  const handleOpenEdit = (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setNombre(perfil.nombre);
    setRol(perfil.rol);
    setActivo(perfil.activo);
    setShowModal(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerfil || !nombre.trim()) return;

    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({
          nombre: nombre.trim(),
          rol,
          activo,
        })
        .eq('id', selectedPerfil.id);

      if (error) {
        alert(`Error al actualizar perfil: ${error.message}`);
      } else {
        setShowModal(false);
        loadPerfiles();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActivo = async (perfil: Perfil) => {
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ activo: !perfil.activo })
        .eq('id', perfil.id);

      if (error) {
        alert(`Error al cambiar estado: ${error.message}`);
      } else {
        loadPerfiles();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    }
  };

  const sqlProcedureText = `-- 1. Crea el usuario en Supabase > Authentication > Users > Add User
-- 2. Ejecuta este SQL en Supabase > SQL Editor vinculando el correo:
insert into public.perfiles (id, nombre, rol, activo)
select id, 'Nombre y Apellido', 'supervisor', true
from auth.users where email = 'supervisor@vaporsur.com';`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlProcedureText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Gestión de Usuarios y Perfiles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Control de acceso y asignación de roles (Supervisor / Administrador) para el panel de MaintAI.
          </p>
        </div>

        <button
          onClick={loadPerfiles}
          className="p-2 self-start sm:self-auto rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions on creating new users */}
      <div className="p-5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Procedimiento para dar de alta un nuevo usuario</span>
          </div>
          <button
            onClick={copySqlToClipboard}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar SQL'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Por seguridad institucional, los usuarios de autenticación se crean directamente en el portal de{' '}
          <strong>Supabase Auth</strong>. Una vez creado el usuario con su correo institucional, se le asocia una fila en la tabla <code className="font-mono bg-slate-800 px-1 py-0.5 rounded text-emerald-300">public.perfiles</code>:
        </p>

        <pre className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300 overflow-x-auto border border-slate-800/80">
          {sqlProcedureText}
        </pre>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : perfiles.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No se encontraron perfiles registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nombre</th>
                  <th className="py-3.5 px-4">Identificador (UUID)</th>
                  <th className="py-3.5 px-4">Rol Asignado</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fecha de Alta</th>
                  <th className="py-3.5 px-4 text-right">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {perfiles.map((p) => {
                  const isAdminRole = p.rol === 'admin';
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {p.nombre}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {p.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isAdminRole
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {isAdminRole ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>{isAdminRole ? 'Administrador' : 'Supervisor'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActivo(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                            p.activo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                          title="Clic para cambiar estado de activación"
                        >
                          {p.activo ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatFechaHoraLima(p.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar perfil"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Modificar Perfil de Usuario
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rol de Acceso
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as RolUsuario)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="supervisor">Supervisor (Ver, editar, validar y rechazar reportes)</option>
                  <option value="admin">Administrador (Acceso total, técnicos Telegram, usuarios y borrado)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkPerfilActivo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="chkPerfilActivo" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Perfil Activo (Permite acceso al panel)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
