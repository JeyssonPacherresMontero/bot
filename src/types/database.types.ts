export type RolUsuario = 'supervisor' | 'admin';

export type EstadoReporte = 'pendiente' | 'corregido' | 'confirmado' | 'revisado' | 'rechazado';

export type PrioridadReporte = 'baja' | 'media' | 'alta' | 'critica';

export type TipoMantenimiento = 'preventivo' | 'correctivo' | 'predictivo' | 'inspeccion' | 'otro';

export type OrigenReporte = 'audio' | 'texto';

export interface RepuestoItem {
  nombre: string;
  cantidad: number | null;
  codigo: string | null;
}

export interface Perfil {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
}

export interface UsuarioTelegram {
  chat_id: number;
  nombre: string;
  cargo: string | null;
  activo: boolean;
  created_at: string;
  total_reportes?: number;
}

export interface Reporte {
  id: string;
  numero: number;
  created_at: string;
  updated_at: string;
  telegram_chat_id: number | null;
  telegram_message_id: number | null;
  tecnico_nombre: string | null;
  tecnico_username: string | null;
  origen: OrigenReporte | null;
  audio_duracion_seg: number | null;
  texto_original: string | null;
  texto_correccion: string | null;
  equipo: string | null;
  codigo_equipo: string | null;
  area: string | null;
  tipo_mantenimiento: TipoMantenimiento | null;
  falla: string | null;
  causa_probable: string | null;
  actividades: string[];
  repuestos: RepuestoItem[];
  prioridad: PrioridadReporte | null;
  numero_ot: string | null;
  fecha_intervencion: string | null;
  duracion_minutos: number | null;
  observaciones: string | null;
  campos_faltantes: string[];
  confianza: number | null;
  raw_ia: Record<string, unknown> | null;
  tiempo_procesamiento_ms: number | null;
  estado: EstadoReporte;
  correcciones: number;
  comentario_supervisor: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  // Relaciones
  supervisor_revisor?: {
    nombre: string;
  } | null;
}

export interface VKpiResumen {
  total_reportes: number;
  confirmados: number;
  pendientes: number;
  rechazados: number;
  pct_sin_correccion: number | null;
  duracion_promedio_min: number | null;
  procesamiento_promedio_seg: number | null;
  confianza_promedio: number | null;
}

export interface VReportesPorDia {
  dia: string;
  total: number;
}

export interface VFallasPorEquipo {
  equipo: string;
  total_fallas: number;
  duracion_promedio_min: number | null;
  ultimo_reporte: string;
}

export interface VRepuestosMasUsados {
  repuesto: string;
  unidades: number;
  veces: number;
}

export interface VReportesPorTecnico {
  tecnico: string;
  total: number;
  duracion_promedio_min: number | null;
}
