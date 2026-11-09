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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
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
  RefreshCw,
} from 'lucide-react';

export default function TecnicosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const toast = useToast();
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

  // Delete confirm state
  const [deletingTecnico, setDeletingTecnico] = useState<UsuarioTelegram | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadTecnicos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios_telegram')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usuarios_telegram:', error);
        toast.error('Error al cargar la lista de técnicos');
      } else {
        const list = (data as UsuarioTelegram[]) || [];
        setTecnicos(list);

        // Cuenta de actividad basada únicamente en reportes visibles y confirmados
        const { data: reportesData } = await supabase
          .from('reportes')
          .select('telegram_chat_id')
          .in('estado', ['confirmado', 'revisado', 'rechazado']);

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
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadTecnicos();
  }, [loadTecnicos]);

  if (!authLoading && !isAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acceso Restringido"
        description="Solo los administradores autorizados de planta pueden gestionar la lista de técnicos de Telegram."
        className="py-16"
      />
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
      toast.warning('Campos incompletos', 'El Chat ID y el Nombre son obligatorios.');
      return;
    }

    const chatIdNum = Number(modalChatId.trim());
    if (isNaN(chatIdNum)) {
      toast.error('Chat ID Inválido', 'El Chat ID de Telegram debe ser un número entero.');
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
          toast.error('Error al actualizar técnico', error.message);
        } else {
          toast.success('Técnico actualizado con éxito');
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
          toast.error('Error al registrar técnico', error.message);
        } else {
          toast.success('Técnico registrado con éxito');
          setShowModal(false);
          loadTecnicos();
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error inesperado', error.message);
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
        toast.error('Error al cambiar estado', error.message);
      } else {
        toast.info(
          tec.activo ? 'Técnico desactivado' : 'Técnico activado',
          `${tec.nombre} ahora está ${tec.activo ? 'inactivo' : 'activo'}.`
        );
        loadTecnicos();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error', error.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTecnico) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('usuarios_telegram')
        .delete()
        .eq('chat_id', deletingTecnico.chat_id);

      if (error) {
        toast.error('Error al eliminar técnico', error.message);
      } else {
        toast.success('Técnico eliminado de la lista autorizada');
        setDeletingTecnico(null);
        loadTecnicos();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error', error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={loadTecnicos}
        isLoading={loading}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        aria-label="Recargar lista de técnicos"
      >
        <span className="hidden sm:inline">Recargar</span>
      </Button>

      <Button
        variant="primary"
        size="sm"
        onClick={handleOpenCreate}
        leftIcon={<Plus className="w-3.5 h-3.5" />}
      >
        <span>Registrar Técnico</span>
      </Button>
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
      <Card className="p-4 flex items-start gap-3 text-xs bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50">
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
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bot className="w-4 h-4" />
            </div>
            <CardTitle>
              <span>Técnicos Habilitados en el Bot</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md ml-1">
                {tecnicos.length}
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : tecnicos.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No hay técnicos registrados"
              description="Añade técnicos de planta autorizados para permitirles enviar reportes de intervención vía Telegram."
              actionLabel="Registrar Primer Técnico"
              actionIcon={<Plus className="w-4 h-4" />}
              onAction={handleOpenCreate}
              className="py-12"
            />
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
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
                              className="inline-flex items-center gap-1.5 cursor-pointer text-xs transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
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
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label={`Editar técnico ${t.nombre}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingTecnico(t)}
                                className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                aria-label={`Eliminar técnico ${t.nombre}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                {tecnicos.map((t) => {
                  const count = reportCountMap[t.chat_id] || 0;
                  return (
                    <div
                      key={t.chat_id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {t.nombre}
                          </span>
                          <span className="block text-[11px] font-mono text-slate-500">
                            Chat ID: {t.chat_id}
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleActivo(t)}
                          className="cursor-pointer"
                        >
                          {t.activo ? (
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

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Cargo: {t.cargo || 'No especificado'}</span>
                        <span className="font-medium text-blue-600">{count} reportes</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEdit(t)}
                          leftIcon={<Edit2 className="w-3 h-3" />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => setDeletingTecnico(t)}
                          leftIcon={<Trash2 className="w-3 h-3" />}
                        >
                          Eliminar
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

      {/* Accessible Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTecnico ? 'Editar Técnico de Telegram' : 'Registrar Nuevo Técnico'}
        description={
          editingTecnico
            ? 'Actualiza los datos o estado del técnico de planta.'
            : 'Asocia el Chat ID del técnico para que pueda reportar intervenciones por Telegram.'
        }
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div>
            <label htmlFor="modal-chat-id" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Telegram Chat ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="modal-chat-id"
              type="text"
              required
              disabled={Boolean(editingTecnico)}
              value={modalChatId}
              onChange={(e) => setModalChatId(e.target.value)}
              placeholder="Ej. 123456789"
              className="modern-input font-mono"
            />
            {editingTecnico && (
              <p className="text-[11px] text-slate-400 mt-1">
                El Chat ID no se puede modificar una vez registrado.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="modal-nombre" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              id="modal-nombre"
              type="text"
              required
              value={modalNombre}
              onChange={(e) => setModalNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="modern-input"
            />
          </div>

          <div>
            <label htmlFor="modal-cargo" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Especialidad o Cargo
            </label>
            <input
              id="modal-cargo"
              type="text"
              value={modalCargo}
              onChange={(e) => setModalCargo(e.target.value)}
              placeholder="Ej. Técnico Mecánico Senior, Electricista"
              className="modern-input"
            />
          </div>

          <div className="pt-2">
            <label htmlFor="modal-activo" className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="modal-activo"
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
              {editingTecnico ? 'Guardar Cambios' : 'Registrar Técnico'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Accessible Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingTecnico)}
        onClose={() => setDeletingTecnico(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Técnico"
        message={`¿Estás seguro de que deseas eliminar a ${deletingTecnico?.nombre} de la lista autorizada? Ya no podrá enviar reportes mediante Telegram.`}
        confirmLabel="Eliminar Técnico"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}