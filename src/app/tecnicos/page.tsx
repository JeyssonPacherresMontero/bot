'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
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
    if (isAdmin) {
      loadTecnicos();
    }
  }, [isAdmin, loadTecnicos]);

  if (!authLoading && !isAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Acceso Restringido
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          La gestión de técnicos autorizados de Telegram está reservada únicamente para administradores.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Técnicos de Mantenimiento en Telegram
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Lista blanca de usuarios autorizados para interactuar con el bot y enviar reportes vía Telegram.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTecnicos}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Técnico</span>
          </button>
        </div>
      </div>

      {/* Helper Box */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-300">
        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">¿Cómo obtiene el técnico su Chat ID?</p>
          <p className="text-blue-800 dark:text-blue-300/90 leading-relaxed">
            El técnico solo debe abrir el bot de Telegram en su celular y enviar el comando{' '}
            <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
              /start
            </code>
            . El bot le responderá inmediatamente con su número identificador (Chat ID). Cópialo y regístralo aquí.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : tecnicos.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No hay técnicos registrados. Agrega uno con el botón superior.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Chat ID</th>
                  <th className="py-3.5 px-4">Nombre Completo</th>
                  <th className="py-3.5 px-4">Cargo / Especialidad</th>
                  <th className="py-3.5 px-4">Reportes Enviados</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fecha Registro</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tecnicos.map((t) => {
                  const count = reportCountMap[t.chat_id] || 0;
                  return (
                    <tr
                      key={t.chat_id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {t.chat_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {t.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {t.cargo || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {count} reporte{count === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActivo(t)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                            t.activo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                          title="Clic para cambiar estado"
                        >
                          {t.activo ? (
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
                        {formatFechaHoraLima(t.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingTecnico ? 'Editar Técnico' : 'Registrar Nuevo Técnico'}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chat ID de Telegram <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingTecnico}
                  value={modalChatId}
                  onChange={(e) => setModalChatId(e.target.value)}
                  placeholder="Ej. 123456789"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalNombre}
                  onChange={(e) => setModalNombre(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cargo o Especialidad
                </label>
                <input
                  type="text"
                  value={modalCargo}
                  onChange={(e) => setModalCargo(e.target.value)}
                  placeholder="Ej. Técnico Mecánico, Electricista, Instrumentista"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkActivo"
                  checked={modalActivo}
                  onChange={(e) => setModalActivo(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="chkActivo" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Técnico Activo (Permite enviar reportes)
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
