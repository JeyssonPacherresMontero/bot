'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
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
  RefreshCw,
} from 'lucide-react';

export default function UsuariosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const toast = useToast();
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
        toast.error('Error al cargar la lista de perfiles');
      } else {
        setPerfiles((data as Perfil[]) || []);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadPerfiles();
  }, [loadPerfiles]);

  if (!authLoading && !isAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acceso Restringido"
        description="Solo los administradores autorizados pueden gestionar roles y perfiles de usuario."
        className="py-16"
      />
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
        toast.error('Error al actualizar perfil', error.message);
      } else {
        toast.success('Perfil de usuario actualizado con éxito');
        setShowModal(false);
        loadPerfiles();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error inesperado', error.message);
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
        toast.error('Error al cambiar estado', error.message);
      } else {
        toast.info(
          perfil.activo ? 'Usuario desactivado' : 'Usuario activado',
          `${perfil.nombre} ahora está ${perfil.activo ? 'inactivo' : 'activo'}.`
        );
        loadPerfiles();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error', error.message);
    }
  };

  const actions = (
    <Button
      variant="outline"
      size="sm"
      onClick={loadPerfiles}
      isLoading={loading}
      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
      aria-label="Recargar lista de usuarios"
    >
      <span className="hidden sm:inline">Recargar</span>
    </Button>
  );

  return (
    <div className="space-y-5">
      {/* Content Header */}
      <ContentHeader
        title="Gestión de Usuarios y Perfiles"
        subtitle="Control de acceso y asignación de roles para el panel de supervisión de MaintAI"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Gestión Usuarios', active: true },
        ]}
        actions={actions}
      />

      {/* Enterprise Policy Notice */}
      <Card className="p-4 text-xs bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Política de Autorización y Nuevos Accesos</span>
        </div>

        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Las credenciales de acceso institucional se administran a través del proveedor centralizado de autenticación. Al dar de alta un nuevo colaborador en la consola de seguridad, su perfil de acceso como <strong>Supervisor</strong> o <strong>Administrador</strong> se sincronizará automáticamente para su gestión en esta tabla.
        </p>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <UserCog className="w-4 h-4" />
            </div>
            <CardTitle>
              <span>Usuarios Registrados en el Sistema</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md ml-1">
                {perfiles.length}
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : perfiles.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="No hay perfiles registrados"
              description="Aún no se han dado de alta usuarios en la base de datos."
              className="py-12"
            />
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4">Nombre Completo</th>
                      <th className="py-3 px-4">Identificador Único</th>
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
                              className="inline-flex items-center gap-1.5 cursor-pointer text-xs transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
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
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenEdit(p)}
                              leftIcon={<Edit2 className="w-3 h-3" />}
                            >
                              Editar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                {perfiles.map((p) => {
                  const isAdminRole = p.rol === 'admin';
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {p.nombre}
                        </span>
                        <button
                          onClick={() => handleToggleActivo(p)}
                          className="cursor-pointer"
                        >
                          {p.activo ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-xs font-medium">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md text-xs font-medium">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Inactivo
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                            isAdminRole
                              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          {isAdminRole ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          <span>{isAdminRole ? 'Administrador' : 'Supervisor'}</span>
                        </span>
                        <span className="text-slate-500">{formatFechaHoraLima(p.created_at)}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEdit(p)}
                          leftIcon={<Edit2 className="w-3 h-3" />}
                        >
                          Editar Perfil
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Accessible Edit Profile Modal */}
      <Modal
        isOpen={showModal && Boolean(selectedPerfil)}
        onClose={() => setShowModal(false)}
        title="Editar Perfil de Usuario"
        description="Modifica los permisos o datos de acceso del colaborador."
      >
        {selectedPerfil && (
          <form onSubmit={handleSaveModal} className="space-y-4">
            <div>
              <label htmlFor="user-modal-id" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Identificador de Cuenta
              </label>
              <input
                id="user-modal-id"
                type="text"
                disabled
                value={selectedPerfil.id}
                className="modern-input font-mono opacity-60 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="user-modal-nombre" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-modal-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="modern-input"
              />
            </div>

            <div>
              <label htmlFor="user-modal-rol" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Rol en la Plataforma
              </label>
              <select
                id="user-modal-rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as RolUsuario)}
                className="modern-input"
              >
                <option value="supervisor">Supervisor (Revisión y validación de reportes)</option>
                <option value="admin">Administrador (Control total del sistema)</option>
              </select>
            </div>

            <div className="pt-2">
              <label htmlFor="user-modal-activo" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="user-modal-activo"
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={formLoading}
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}