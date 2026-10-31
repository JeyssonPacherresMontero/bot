'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ContentHeader } from '@/components/layout/ContentHeader';
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
    loadPerfiles();
  }, [loadPerfiles]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="p-10 text-center modern-card border border-rose-200 dark:border-rose-900/50">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Acceso Restringido
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Solo los administradores del sistema pueden gestionar los perfiles de usuario.
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
    if (!selectedPerfil) return;

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

  const actions = (
    <button
      onClick={loadPerfiles}
      className="btn-modern-default text-xs"
      title="Recargar"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      <span>Recargar</span>
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Content Header */}
      <ContentHeader
        title="Gestión de Usuarios y Perfiles"
        subtitle="Control de acceso y asignación de roles para el panel de MaintAI"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Gestión Usuarios', active: true },
        ]}
        actions={actions}
      />

      {/* Enterprise Policy Notice (Replaces raw SQL block) */}
      <div className="modern-card p-4 text-xs bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Política de Autorización y Nuevos Accesos</span>
        </div>

        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Las credenciales de acceso institucional se administran de forma segura a través del proveedor de autenticación centralizado. Al dar de alta un nuevo colaborador en la consola de seguridad, su perfil de acceso como <strong>Supervisor</strong> o <strong>Administrador</strong> se sincronizará automáticamente para su gestión en esta tabla.
        </p>
      </div>

      {/* Users Table */}
      <div className="modern-card">
        <div className="modern-card-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <UserCog className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Usuarios Registrados en el Sistema
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
              {perfiles.length}
            </span>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : perfiles.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No se encontraron perfiles registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Identificador Único de Cuenta</th>
                    <th className="py-3 px-4">Rol Asignado</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha de Alta</th>
                    <th className="py-3 px-4 text-right">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {perfiles.map((p) => {
                    const isAdminRole = p.rol === 'admin';
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {p.nombre}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {p.id}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                              isAdminRole
                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
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
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActivo(p)}
                            className="inline-flex items-center gap-1.5 cursor-pointer text-xs transition-opacity hover:opacity-80"
                            title="Haz clic para activar o desactivar usuario"
                          >
                            {p.activo ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
                                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                Inactivo
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatFechaHoraLima(p.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="btn-modern-default py-1 px-2.5 text-xs"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
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
      </div>

      {/* Edit Profile Modal */}
      {showModal && selectedPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md modern-card shadow-dropdown">
            <div className="modern-card-header">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                Editar Perfil de Usuario
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="modern-card-body space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Identificador de Cuenta
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedPerfil.id}
                    className="modern-input font-mono opacity-60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="modern-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Rol en la Plataforma
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as RolUsuario)}
                    className="modern-input"
                  >
                    <option value="supervisor">Supervisor (Revisión y validación de reportes)</option>
                    <option value="admin">Administrador (Control total del sistema)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Usuario activo con permiso para iniciar sesión
                    </span>
                  </label>
                </div>
              </div>

              <div className="modern-card-footer flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-modern-default text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-modern-primary text-xs"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
