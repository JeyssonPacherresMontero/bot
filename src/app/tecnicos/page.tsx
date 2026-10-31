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
      <div className="p-10 text-center modern-card border border-rose-200 dark:border-rose-900/50">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Acceso Restringido
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
      `¿Deseas eliminar a ${tec.nombre} de la lista de técnicos autorizados?`
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
        className="btn-modern-default text-xs"
        title="Recargar"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleOpenCreate}
        className="btn-modern-primary text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Registrar Técnico</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Content Header */}
      <ContentHeader
        title="Técnicos de Mantenimiento en Telegram"
        subtitle="Lista autorizada de personal de planta para interactuar con el bot y enviar reportes vía Telegram"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Técnicos Telegram', active: true },
        ]}
        actions={actions}
      />

      {/* Helper Box */}
      <div className="modern-card p-4 flex items-start gap-3 text-xs bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50">
        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            ¿Cómo obtiene el técnico su Chat ID?
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            El técnico debe abrir el bot de Telegram en su dispositivo y enviar el comando{' '}
            <code className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono font-semibold">
              /start
            </code>
            . El bot le responderá de inmediato con su identificador numérico de Chat ID para que lo registres aquí.
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="modern-card">
        <div className="modern-card-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Técnicos Habilitados en el Bot
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
              {tecnicos.length}
            </span>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No hay técnicos registrados. Agrega uno con el botón superior.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="py-3 px-4">Chat ID</th>
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Especialidad Técnica</th>
                    <th className="py-3 px-4">Reportes Enviados</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha Registro</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tecnicos.map((t) => {
                    const count = reportCountMap[t.chat_id] || 0;
                    return (
                      <tr
                        key={t.chat_id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {t.chat_id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {t.nombre}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {t.cargo || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            {count} reporte{count === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActivo(t)}
                            className="inline-flex items-center gap-1.5 cursor-pointer text-xs transition-opacity hover:opacity-80"
                            title="Haz clic para activar o desactivar"
                          >
                            {t.activo ? (
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
                          {formatFechaHoraLima(t.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="btn-modern-default py-1 px-2 text-xs"
                              title="Editar"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
                              className="btn-modern-danger py-1 px-2 text-xs"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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

      {/* Modal Crear / Editar Técnico */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md modern-card shadow-dropdown">
            <div className="modern-card-header">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                {editingTecnico ? 'Editar Técnico de Telegram' : 'Registrar Nuevo Técnico'}
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
                    Telegram Chat ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTecnico}
                    value={modalChatId}
                    onChange={(e) => setModalChatId(e.target.value)}
                    placeholder="Ej. 123456789"
                    className="modern-input font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {editingTecnico && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      El Chat ID no se puede modificar una vez registrado.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={modalNombre}
                    onChange={(e) => setModalNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="modern-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Especialidad o Cargo
                  </label>
                  <input
                    type="text"
                    value={modalCargo}
                    onChange={(e) => setModalCargo(e.target.value)}
                    placeholder="Ej. Técnico Mecánico Senior, Electricista"
                    className="modern-input"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modalActivo}
                      onChange={(e) => setModalActivo(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Técnico habilitado para interactuar con el bot
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
                  <span>{editingTecnico ? 'Guardar Cambios' : 'Registrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
