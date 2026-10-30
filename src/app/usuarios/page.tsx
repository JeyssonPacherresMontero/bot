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
    loadPerfiles();
  }, [loadPerfiles]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="p-8 text-center lte-card border-t-[3px] border-t-[#dc3545]">
        <ShieldAlert className="w-10 h-10 text-[#dc3545] mx-auto mb-2" />
        <h2 className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
          Acceso Restringido
        </h2>
        <p className="text-xs text-[#6c757d] dark:text-[#ced4da] mt-1">
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

  const actions = (
    <button
      onClick={loadPerfiles}
      className="btn-lte-default text-xs"
      title="Recargar"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      <span>Recargar</span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Content Header AdminLTE */}
      <ContentHeader
        title="Gestión de Usuarios y Perfiles"
        subtitle="Control de acceso y asignación de roles (Supervisor / Administrador) para el panel de MaintAI LTE."
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Gestión Usuarios', active: true },
        ]}
        actions={actions}
      />

      {/* Instructions on creating new users - AdminLTE Callout Style */}
      <div className="lte-card border-l-4 border-l-[#17a2b8] p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#17a2b8] font-bold uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Procedimiento para dar de alta un nuevo usuario</span>
          </div>
          <button
            onClick={copySqlToClipboard}
            className="btn-lte-default text-xs py-0.5 px-2 font-medium"
          >
            {copied ? <Check className="w-3 h-3 text-[#28a745]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Copiar SQL'}</span>
          </button>
        </div>

        <p className="text-[#6c757d] dark:text-[#ced4da] leading-relaxed">
          Por seguridad institucional, las credenciales se generan directamente en el panel de{' '}
          <strong>Supabase Authentication</strong>. Una vez creado el usuario con su correo, se le asigna su perfil en <code className="font-mono bg-[#e9ecef] dark:bg-[#4b545c] px-1 py-0.5 rounded text-[#007bff]">public.perfiles</code>:
        </p>

        <pre className="p-2.5 rounded-[0.25rem] bg-[#212529] font-mono text-[11px] text-[#20c997] overflow-x-auto">
          {sqlProcedureText}
        </pre>
      </div>

      {/* Users Table - AdminLTE Card Outline */}
      <div className="lte-card border-t-[3px] border-t-[#6f42c1]">
        <div className="lte-card-header">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#6f42c1]" />
            <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
              Usuarios Registrados en el Sistema
            </span>
            <span className="bg-[#6f42c1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]">
              {perfiles.length}
            </span>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : perfiles.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#adb5bd]">
              No se encontraron perfiles registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f6f9] dark:bg-[#2c3338] text-[#495057] dark:text-[#ced4da] font-semibold border-b border-[#dee2e6] dark:border-[#4b545c]">
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Nombre</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Identificador (UUID)</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Rol Asignado</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Estado</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Fecha de Alta</th>
                    <th className="py-2.5 px-3 text-right">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6] dark:divide-[#4b545c]">
                  {perfiles.map((p) => {
                    const isAdminRole = p.rol === 'admin';
                    return (
                      <tr
                        key={p.id}
                        className="even:bg-[#f8f9fa] dark:even:bg-[#2f353a] hover:bg-[#e9ecef]/60 dark:hover:bg-[#3f474e]/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-[#212529] dark:text-[#f8f9fa] border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {p.nombre}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#6c757d] dark:text-[#adb5bd] text-[11px] border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {p.id}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-bold text-white ${
                              isAdminRole ? 'bg-[#6f42c1]' : 'bg-[#007bff]'
                            }`}
                          >
                            {isAdminRole ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            <span>{isAdminRole ? 'ADMINISTRADOR' : 'SUPERVISOR'}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <button
                            onClick={() => handleToggleActivo(p)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold cursor-pointer ${
                              p.activo
                                ? 'bg-[#28a745] text-white'
                                : 'bg-[#6c757d] text-white'
                            }`}
                            title="Clic para cambiar estado de activación"
                          >
                            {p.activo ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Activo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Inactivo</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-[#6c757d] dark:text-[#ced4da] whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {formatFechaHoraLima(p.created_at)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="btn-lte-default text-xs p-1"
                            title="Editar perfil"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#007bff]" />
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
        <div className="lte-card-footer">
          Perfiles autorizados para la interfaz web de supervisión MaintAI LTE
        </div>
      </div>

      {/* Edit Profile Modal - AdminLTE Modal Style */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md lte-card border-t-[4px] border-t-[#6f42c1] shadow-lte-lg">
            <div className="lte-card-header bg-[#6f42c1] text-white">
              <h3 className="text-sm font-bold text-white">
                Modificar Perfil de Usuario
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:opacity-80"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="lte-card-body space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="form-control-lte"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Rol de Acceso
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as RolUsuario)}
                    className="form-control-lte"
                  >
                    <option value="supervisor">Supervisor (Ver, editar, validar y rechazar reportes)</option>
                    <option value="admin">Administrador (Acceso total, técnicos Telegram y usuarios)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkPerfilActivo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-4 h-4 rounded-[0.2rem] text-[#007bff] focus:ring-[#007bff] border-[#ced4da]"
                  />
                  <label
                    htmlFor="chkPerfilActivo"
                    className="font-semibold text-[#495057] dark:text-[#ced4da] cursor-pointer"
                  >
                    Perfil Activo (Habilitado para ingresar al sistema)
                  </label>
                </div>
              </div>

              <div className="lte-card-footer flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-lte-default text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-lte-primary text-xs"
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
