'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatFechaHoraLima } from '@/lib/utils';
import type { UsuarioTelegram } from '@/types/database.types';
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function TecnicosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const supabase = createClient();

  const [tecnicos, setTecnicos] = useState<UsuarioTelegram[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportCountMap, setReportCountMap] = useState<Record<number, number>>({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<UsuarioTelegram | null>(null);
  const [modalChatId, setModalChatId] = useState('');
  const [modalNombre, setModalNombre] = useState('');
  const [modalCargo, setModalCargo] = useState('');
  const [modalActivo, setModalActivo] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const loadTecnicos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios_telegram')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usuarios_telegram:', error);
      } else {
        const list = (data as UsuarioTelegram[]) || [];
        setTecnicos(list);

        // Fetch count of reports per telegram_chat_id
        const { data: reportesData } = await supabase
          .from('reportes')
          .select('telegram_chat_id');

        if (reportesData) {
          const map: Record<number, number> = {};
          reportesData.forEach((r) => {
            if (r.telegram_chat_id) {
              map[r.telegram_chat_id] = (map[r.telegram_chat_id] || 0) + 1;
            }
          });
          setReportCountMap(map);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadTecnicos();
  }, [loadTecnicos]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="p-8 text-center lte-card border-t-[3px] border-t-[#dc3545]">
        <ShieldAlert className="w-10 h-10 text-[#dc3545] mx-auto mb-2" />
        <h2 className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
          Acceso Restringido
        </h2>
        <p className="text-xs text-[#6c757d] dark:text-[#ced4da] mt-1">
          Solo los administradores del sistema pueden gestionar la lista de técnicos de Telegram.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingTecnico(null);
    setModalChatId('');
    setModalNombre('');
    setModalCargo('');
    setModalActivo(true);
    setShowModal(true);
  };

  const handleOpenEdit = (tec: UsuarioTelegram) => {
    setEditingTecnico(tec);
    setModalChatId(String(tec.chat_id));
    setModalNombre(tec.nombre);
    setModalCargo(tec.cargo || '');
    setModalActivo(tec.activo);
    setShowModal(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalChatId.trim() || !modalNombre.trim()) {
      alert('El Chat ID y el Nombre son obligatorios.');
      return;
    }

    const chatIdNum = Number(modalChatId.trim());
    if (isNaN(chatIdNum)) {
      alert('El Chat ID de Telegram debe ser un número entero.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingTecnico) {
        // Update
        const { error } = await supabase
          .from('usuarios_telegram')
          .update({
            nombre: modalNombre.trim(),
            cargo: modalCargo.trim() || null,
            activo: modalActivo,
          })
          .eq('chat_id', editingTecnico.chat_id);

        if (error) {
          alert(`Error al actualizar técnico: ${error.message}`);
        } else {
          setShowModal(false);
          loadTecnicos();
        }
      } else {
        // Insert
        const { error } = await supabase.from('usuarios_telegram').insert({
          chat_id: chatIdNum,
          nombre: modalNombre.trim(),
          cargo: modalCargo.trim() || null,
          activo: modalActivo,
        });

        if (error) {
          alert(`Error al registrar técnico: ${error.message}`);
        } else {
          setShowModal(false);
          loadTecnicos();
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActivo = async (tec: UsuarioTelegram) => {
    try {
      const { error } = await supabase
        .from('usuarios_telegram')
        .update({ activo: !tec.activo })
        .eq('chat_id', tec.chat_id);

      if (error) {
        alert(`Error al cambiar estado: ${error.message}`);
      } else {
        loadTecnicos();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (tec: UsuarioTelegram) => {
    const confirmDel = confirm(
      `¿Deseas eliminar a ${tec.nombre} (${tec.chat_id}) de la lista de técnicos autorizados?`
    );
    if (!confirmDel) return;

    try {
      const { error } = await supabase
        .from('usuarios_telegram')
        .delete()
        .eq('chat_id', tec.chat_id);

      if (error) {
        alert(`Error al eliminar: ${error.message}`);
      } else {
        loadTecnicos();
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      <button
        onClick={loadTecnicos}
        className="btn-lte-default text-xs"
        title="Recargar"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleOpenCreate}
        className="btn-lte-primary text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Registrar Técnico</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Content Header AdminLTE */}
      <ContentHeader
        title="Técnicos de Mantenimiento en Telegram"
        subtitle="Lista blanca de usuarios autorizados para interactuar con el bot y enviar reportes vía Telegram."
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Técnicos Telegram', active: true },
        ]}
        actions={actions}
      />

      {/* Helper Box - AdminLTE Callout Style */}
      <div className="lte-card border-l-4 border-l-[#17a2b8] p-3 flex items-start gap-3 text-xs">
        <HelpCircle className="w-5 h-5 text-[#17a2b8] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#212529] dark:text-[#f8f9fa]">
            ¿Cómo obtiene el técnico su Chat ID?
          </p>
          <p className="text-[#6c757d] dark:text-[#ced4da] leading-relaxed">
            El técnico solo debe abrir el bot de Telegram en su celular y enviar el comando{' '}
            <code className="bg-[#e9ecef] dark:bg-[#4b545c] text-[#007bff] dark:text-[#66b0ff] px-1.5 py-0.5 rounded font-mono font-bold">
              /start
            </code>
            . El bot le responderá inmediatamente con su número identificador (Chat ID). Cópialo y regístralo aquí.
          </p>
        </div>
      </div>

      {/* Table Card - AdminLTE Card Outline */}
      <div className="lte-card border-t-[3px] border-t-[#007bff]">
        <div className="lte-card-header">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#007bff]" />
            <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
              Técnicos Habilitados en el Bot
            </span>
            <span className="bg-[#007bff] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]">
              {tecnicos.length}
            </span>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#adb5bd]">
              No hay técnicos registrados. Agrega uno con el botón superior.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f6f9] dark:bg-[#2c3338] text-[#495057] dark:text-[#ced4da] font-semibold border-b border-[#dee2e6] dark:border-[#4b545c]">
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Chat ID</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Nombre Completo</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Cargo / Especialidad</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Reportes Enviados</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Estado</th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">Fecha Registro</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6] dark:divide-[#4b545c]">
                  {tecnicos.map((t) => {
                    const count = reportCountMap[t.chat_id] || 0;
                    return (
                      <tr
                        key={t.chat_id}
                        className="even:bg-[#f8f9fa] dark:even:bg-[#2f353a] hover:bg-[#e9ecef]/60 dark:hover:bg-[#3f474e]/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#007bff] border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {t.chat_id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#212529] dark:text-[#f8f9fa] border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {t.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-[#495057] dark:text-[#ced4da] border-r border-[#dee2e6] dark:border-[#4b545c]">
                          {t.cargo || '—'}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <span className="font-bold text-[#28a745]">
                            {count} reporte{count === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                          <button
                            onClick={() => handleToggleActivo(t)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-semibold cursor-pointer ${
                              t.activo
                                ? 'bg-[#28a745] text-white'
                                : 'bg-[#6c757d] text-white'
                            }`}
                            title="Clic para cambiar estado"
                          >
                            {t.activo ? (
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
                          {formatFechaHoraLima(t.created_at)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="btn-lte-default text-xs p-1"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#007bff]" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="btn-lte-danger text-xs p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          Base de datos de acceso al webhook de Telegram en n8n
        </div>
      </div>

      {/* Create / Edit Modal - AdminLTE Modal Style */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md lte-card border-t-[4px] border-t-[#007bff] shadow-lte-lg">
            <div className="lte-card-header bg-[#007bff] text-white">
              <h3 className="text-sm font-bold text-white">
                {editingTecnico ? 'Editar Técnico' : 'Registrar Nuevo Técnico'}
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
                    Chat ID de Telegram <span className="text-[#dc3545]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTecnico}
                    value={modalChatId}
                    onChange={(e) => setModalChatId(e.target.value)}
                    placeholder="Ej. 123456789"
                    className="form-control-lte font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Nombre Completo <span className="text-[#dc3545]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={modalNombre}
                    onChange={(e) => setModalNombre(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="form-control-lte"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#495057] dark:text-[#ced4da] mb-1">
                    Cargo o Especialidad
                  </label>
                  <input
                    type="text"
                    value={modalCargo}
                    onChange={(e) => setModalCargo(e.target.value)}
                    placeholder="Ej. Técnico Mecánico, Electricista"
                    className="form-control-lte"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkActivo"
                    checked={modalActivo}
                    onChange={(e) => setModalActivo(e.target.checked)}
                    className="w-4 h-4 rounded-[0.2rem] text-[#007bff] focus:ring-[#007bff] border-[#ced4da]"
                  />
                  <label
                    htmlFor="chkActivo"
                    className="font-semibold text-[#495057] dark:text-[#ced4da] cursor-pointer"
                  >
                    Técnico Activo (Habilitado para reportar en Telegram)
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
                  <span>{editingTecnico ? 'Guardar Cambios' : 'Registrar Técnico'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
